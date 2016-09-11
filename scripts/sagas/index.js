/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
import { takeEvery } from 'redux-saga';
import { effects } from 'redux-saga';
const put = effects.put;
const call = effects.call;
const take = effects.take;
const fork = effects.fork;
const select = effects.select;
const apply = effects.apply;

//import { call, put, take, fork, select, apply } from 'redux-saga/effects';
import createChannel from './channel';
import * as Api from '../api';
import {getAccessToken, getGenotypeId, getTaskId} from '../reducers/selectors';
import {
  saveAvailableTraits,
  saveAailableProviders,
  genotypeUploadFailed, uploadGenotypeFinished,
  startGenotypeUpload, analysisFailed,
  analysisStarted,
  analysisCanceled,displayCloudGenotypes,
  loadAnalysisDataFailed,startAnalysis,
  displayAnalysisData,subscribeToUpdatesFailed,
  messageReceived,analysisFinished
} from '../actions';


var subscription;

const wrapper = {
  client: null,

  connect(url) {
    var wr = this;
    return new Promise(function(resolve, reject) {
      // Do the usual XHR stuff
      const ws = new SockJS('/stomp');
      wr.client = Stomp.over(ws);
      wr.client.heartbeat.outgoing = 0;
      wr.client.heartbeat.incoming = 0;
      wr.client.connect('guest', 'guest', function() {
        resolve();
      }, function() {
        reject(new Error('could not connect'));
      }, '/');
    });
  },
  subscribe(id) {
    var wr = this;
    return {
      subscription: null,
      on(cb) {
        let headers = {id: id,durable: false,'auto-delete': true, exclusive: true,'x-expires': 86400000};
        let dest = '/queue/updates_' + id;
        this.subscription = wr.client.subscribe(dest, cb, headers);
      }
    };
  }
};

/*function* connectToStomp() {
  const action = yield take('GENOTYPE_UPLOAD_FINISHED');
  const msgSource = yield call(createSource, '/myurl');
  yield fork(watchMessages, msgSource)
}*/



function* uploadGenotype(action) {
  try {
    let id = action.id;
    yield put(startGenotypeUpload(id));
    const response = yield call(Api.uploadGeno, action.file, id);
    yield put(uploadGenotypeFinished(id, response.data));
  } catch (error) {
    console.log(error);
    yield put(genotypeUploadFailed(error,action.id));
  }
}

function* watchUploadGenotype() {
  yield* takeEvery('UPLOAD_GENOTYPE', uploadGenotype);
}

function* monitorStompEvents(channel) {
  while (true) {
    const message = yield call(channel.take);
    var body = JSON.parse(message.body);
    switch (body.state) {
      case 'FINISHED':
        yield put(analysisFinished(body,body.id));
        break;
      case 'ERROR':
        yield put(analysisFailed(body,body.id));
        break;
      default:
        yield put(messageReceived(body,body.id));
    }
  }
}

function* watchWebSocket() {
  while (true) {
    const action = yield take(['LOAD_ANALYSIS']);
    try {
      if (subscription) {
        subscription.subscription.unsubscribe();
      }
      yield apply(wrapper, wrapper.connect);
      subscription = wrapper.subscribe(action.id);
      if (subscription) {
        yield fork(monitorStompEvents, createStompChannel(subscription));
      }
      else {
        throw Error('could not subscribe to updates');
      }
    }
    catch (error) {
      yield put(subscribeToUpdatesFailed(error,action.id));
    }
  }
}

function* startRetrieveAnalysisData(analysisType, body, id) {
  const taskId = yield select(getTaskId, analysisType, body.data,id);
  var loadDataFunc = null;
  switch (analysisType) {
    case 'imputation':
      loadDataFunc = Api.loadImputationData;
      break;
    case 'ancestry':
      loadDataFunc = Api.loadAncestryData;
      break;
    case 'riskprediction':
      loadDataFunc = Api.loadRiskData;
      break;
    default:
      loadDataFunc = null;
  }
  if (loadDataFunc !== null) {
    try {
      const response = yield call(loadDataFunc, id, taskId);
      if (response.state != 'SUCCESS') {
        throw new Error(analysisType + ' failed');
      }
      yield put(displayAnalysisData(analysisType, response.data, id));
      if (analysisType == 'imputation') {
        yield put(startAnalysis('ancestry', id));
      }
      else if (analysisType == 'ancestry') {

      }
    }
    catch (error) {
      yield put(loadAnalysisDataFailed(analysisType, error, id));
    }
  }
}

function* watchFinishAnalysis() {
  while (true) {
    const {analysisType, body, id} = yield take('RUN_ANALYSIS_FINISHED');
    yield fork(startRetrieveAnalysisData,analysisType,body, id);
  }
}

function* watchRetrieveOAuthToken() {
  while (true) {
    const {provider, code, id} = yield take('RETRIEVE_CLOUD_GENOTYPES');
    const response = yield call(Api.retrieveCloudGenotypes, provider, code);
    yield put(displayCloudGenotypes(provider, response.access_token, response.refresh_token, code, response.userInfo, id));
  }
}

function* watchStartAnalysis() {
  while (true) {
    const action = yield take(['RUN_ANALYSIS','GENOTYPE_UPLOAD_FINISHED']);
    let analysisType = action.analysisType;
    if (action.type === 'GENOTYPE_UPLOAD_FINISHED') {
      analysisType = 'imputation';
    }
    const id = yield select(getGenotypeId);
    var analysisFunc = null;
    switch (analysisType) {
      case 'imputation':
        analysisFunc = Api.startImputation;
        break;
      case 'ancestry':
        analysisFunc = Api.startAncestry;
        break;
      case 'riskprediction':
        analysisFunc = Api.startRiskprediction;
        break;
      default:
        analysisFunc = null;
    }
    if (analysisFunc !== null) {
      try {
        const response = yield call(analysisFunc, id);
        yield put(analysisStarted(response.id, analysisType, id));
      }
      catch (error) {
        yield put(analysisFailed({error: error, analysisType}, id));
      }
    }
  }
}

function* cancelAnalysis(action) {
  try {
    let taskIds = [];
    const taskid =  yield select(getTaskId, action.analysisType,action.traits);
    if (taskid instanceof Array) {
      taskIds = [...taskid];
    }
    else {
      taskIds.push(taskid);
    }
    const response = yield call(Api.doCancelAnalysis,action.id, action.analysisType,taskIds);
    yield put(analysisCanceled(action.id,action.analysisType,action.traits));

  } catch (error) {
    console.log(error);
  }
}

function* watchCancelAnalysis() {
  yield* takeEvery('CANCEL_ANALYSIS', cancelAnalysis);
}

function* watchStartPrediction() {
  while (true) {
    const {traits} = yield take('START_PREDICTION');
    const id = yield select(getGenotypeId);
    for (let i = 0; i < traits.length; i++) {
      let trait = traits[i];
      try {
        const response = yield call(Api.startPrediction, id, trait);
        yield put(analysisStarted(response.id, 'riskprediction', id, trait));
      }
      catch (error) {
        console.log(error);
        yield put(analysisFailed({error: error, analysisType: 'riskprediction', trait: trait}, id));
      }
    }
  }
}

function* watchTransferGentoypeFromProvider() {
  while (true) {
    const {provider, id, genotypeId} = yield take('TRANSFER_GENOTYPE_FROM_PROVIDER');
    try {
      const accessToken = yield select(getAccessToken, provider,id);
      yield put(startGenotypeUpload(id));
      const response = yield call(Api.transferGenotypeFromProvider, id, provider, genotypeId, accessToken);
      yield put(uploadGenotypeFinished(response.genotype, response.data, id));
    } catch (error) {
      console.log(error);
      yield put(genotypeUploadFailed(error, id));
    }
  }
}

function* watchLoadAvailableProviders() {
  const response = yield call(Api.loadAvailableProviders);
  yield put(saveAailableProviders(response));
}


function* watchLoadAvailableTraits() {
  const response = yield call(Api.loadAvailableTraits);
  yield put(saveAvailableTraits(response));
}

function createStompChannel(subscription) {
  const channel = createChannel();
  // every change event will call put on the channel
  subscription.on(channel.put);
  return channel;
}



export default function* rootSaga() {
  yield [
    fork(watchCancelAnalysis),
    fork(watchUploadGenotype),
    fork(watchWebSocket),
    fork(watchFinishAnalysis),
    fork(watchStartAnalysis),
    fork(watchLoadAvailableProviders),
    fork(watchRetrieveOAuthToken),
    fork(watchTransferGentoypeFromProvider),
    fork(watchLoadAvailableTraits),
    fork(watchStartPrediction),
  ];
}