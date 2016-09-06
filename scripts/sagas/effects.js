/*global ReduxSaga, Stomp, SockJS */
const effects = ReduxSaga.effects;

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

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

function* connectToStomp() {
  const action = yield take('GENOTYPE_UPLOAD_FINISHED');
  const msgSource = yield call(createSource, '/myurl');
  yield fork(watchMessages, msgSource)
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText)
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function uploadGeno(file, id) {
  var data = new FormData();
  data.append('file', file);
  return fetch(`/api/genotype/${id}`,
    {method: 'POST', body: data}
  ).then(checkStatus)
    .then(parseJSON);
}

function startPrediction(id, trait) {
  return fetch(`/api/riskprediction/${id}/${trait}`,
    {method: 'POST'}
  ).then(checkStatus)
    .then(parseJSON);
}

function transferGenotypeFromProvider(id, provider, genotypeId, accessToken) {
  return fetch(`/api/cloud/${provider}/genome/${genotypeId}/${id}`,
    {method: 'POST', headers: {'ACCESS-TOKEN': accessToken}}
  ).then(checkStatus)
    .then(parseJSON);
}

function startImputation(id) {
  return fetch(`/api/imputation?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

function startAncestry(id) {
  return fetch(`/api/ancestry?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

function startRiskprediction(id) {
  return fetch(`/api/riskprediction?id=${id}`,
    {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

function loadPcsData(platform,pc1,pc2) {
  return fetch(`/api/plotpcs?platform=${platform}&pc1=${pc1}&pc2=${pc2}`,{headers:headers})
    .then(checkStatus)
    .then(parseJSON);
}

function loadImputationData(taskid) {
  return fetch(`/api/imputation?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

function loadRiskData(taskid) {
  return fetch(`/api/riskprediction?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

function loadAncestryData(taskid) {
  return fetch(`/api/ancestry?task_id=${taskid}&wait=1`, {headers: headers})
    .then(checkStatus)
    .then(parseJSON);
}

function retrieveCloudGenotypes(provider, code) {
  return fetch(`/api/cloud/${provider}/token`, {method: 'POST', headers: {CODE: code}})
    .then(checkStatus)
    .then(parseJSON);
}

function generateNewAnalysisId() {
  return fetch('/api/id/' , {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON);
}

function loadAvailableProviders() {
  return fetch('/api/cloud', {headers: headers}).then(checkStatus).then(parseJSON);
}

function loadAvailableTraits() {
  return fetch('/api/traits', {headers: headers}).then(checkStatus).then(parseJSON);
}

function doCancelAnalysis(analysisType, taskids) {
  let promises = [];
  for (let taskid of taskids) {
    promises.push(fetch(`/api/${analysisType}/cancel/${taskid}`, {method: 'POST'})
    .then(checkStatus)
    .then(parseJSON));
  }
  return Promise.all(promises);
}

function* uploadGenotype(action) {
  try {
    let id = action.id;
    yield effects.put(startGenotypeUpload(id));
    const response = yield effects.call(uploadGeno, action.file, id);
    yield effects.put(uploadGenotypeFinished(id, response.data));
  } catch (error) {
    console.log(error);
    yield effects.put(genotypeUploadFailed(error,id));
  }
}

function* watchUploadGenotype() {
  yield* ReduxSaga.takeEvery('UPLOAD_GENOTYPE', uploadGenotype);
}

function* monitorStompEvents(channel) {
  while (true) {
    const message = yield effects.call(channel.take);
    var body = JSON.parse(message.body);
    switch (body.state) {
      case 'FINISHED':
        yield effects.put(analysisFinished(body,body.id));
        break;
      case 'ERROR':
        yield effects.put(analysisFailed(body,body.id));
      default:
        yield effects.put(messageReceived(body,body.id));
    }
  }
}

function* watchWebSocket() {
  while (true) {
    const action = yield effects.take(['LOAD_ANALYSIS']);
    try {
      if (subscription) {
        subscription.subscription.unsubscribe();
      }
      yield effects.apply(wrapper, wrapper.connect);
      subscription = wrapper.subscribe(action.id);
      if (subscription) {
        yield effects.fork(monitorStompEvents, createStompChannel(subscription));
      }
      else {
        throw Error('could not subscribe to updates');
      }
    }
    catch (error) {
      yield effects.put(subscribeToUpdatesFailed(error,action.id));
    }
  }
}

function* startRetrieveAnalysisData(analysisType, body, id) {
  const taskId = yield effects.select(getTaskId, analysisType, body.data,id);
  var loadDataFunc = null;
  switch (analysisType) {
    case 'imputation':
      loadDataFunc = loadImputationData;
      break;
    case 'ancestry':
      loadDataFunc = loadAncestryData;
      break;
    case 'riskprediction':
      loadDataFunc = loadRiskData;
      break;
    default:
      loadDataFunc = null;
  }
  if (loadDataFunc !== null) {
    try {
      const response = yield effects.call(loadDataFunc, taskId);
      if (response.state != 'SUCCESS') {
        throw new Error(analysisType + ' failed');
      }
      yield effects.put(displayAnalysisData(analysisType, response.data, id));
      if (analysisType == 'imputation') {
        yield effects.put(startAnalysis('ancestry', id));
      }
      else if (analysisType == 'ancestry') {

      }
    }
    catch (error) {
      yield effects.put(loadAnalysisDataFailed(analysisType, error, id));
    }
  }
}

function* watchFinishAnalysis() {
  while (true) {
    const {analysisType, body, id} = yield effects.take('RUN_ANALYSIS_FINISHED');
    yield effects.fork(startRetrieveAnalysisData,analysisType,body, id);
  }
}

function* watchRetrieveOAuthToken() {
  while (true) {
    const {provider, code, id} = yield effects.take('RETRIEVE_CLOUD_GENOTYPES');
    const response = yield effects.call(retrieveCloudGenotypes, provider, code);
    yield effects.put(displayCloudGenotypes(provider, response.access_token, response.refresh_token, code, response.userInfo, id));
  }
}

function* watchStartAnalysis() {
  while (true) {
    const action = yield effects.take(['RUN_ANALYSIS','GENOTYPE_UPLOAD_FINISHED']);
    let analysisType = action.analysisType;
    if (action.type === 'GENOTYPE_UPLOAD_FINISHED') {
      analysisType = 'imputation';
    }
    const id = yield effects.select(getGenotypeId);
    var analysisFunc = null;
    switch (analysisType) {
      case 'imputation':
        analysisFunc = startImputation;
        break;
      case 'ancestry':
        analysisFunc = startAncestry;
        break;
      case 'riskprediction':
        analysisFunc = startRiskprediction;
        break;
      default:
        analysisFunc = null;
    }
    if (analysisFunc !== null) {
      try {
        const response = yield effects.call(analysisFunc, id);
        yield effects.put(analysisStarted(response.id, analysisType, id));
      }
      catch (error) {
        yield effects.put(analysisFailed({error: error, analysisType}, id));
      }
    }
  }
}

function* cancelAnalysis(action) {
  try {
    let taskIds = [];
    const taskid =  yield effects.select(getTaskId, action.analysisType,action.traits);
    if (taskid instanceof Array) {
      taskIds = [...taskid];
    }
    else {
      taskIds.push(taskid);
    }
    const response = yield effects.call(doCancelAnalysis, action.analysisType,taskIds);
    yield effects.put(analysisCanceled(action.id,action.analysisType,action.traits));

  } catch (error) {
    console.log(error);
  }
}

function* watchCancelAnalysis() {
  yield* ReduxSaga.takeEvery('CANCEL_ANALYSIS', cancelAnalysis);
}

function* watchStartPrediction() {
  while (true) {
    const {traits} = yield effects.take('START_PREDICTION');
    const id = yield effects.select(getGenotypeId);
    for (let i = 0; i < traits.length; i++) {
      let trait = traits[i];
      try {
        const response = yield effects.call(startPrediction, id, trait);
        yield effects.put(analysisStarted(response.id, 'riskprediction', id, trait));
      }
      catch (error) {
        console.log(error);
        yield effects.put(analysisFailed({error: error, analysisType: 'riskprediction', trait: trait}, id));
      }
    }
  }
}

function* watchTransferGentoypeFromProvider() {
  while (true) {
    const {provider, id, genotypeId} = yield effects.take('TRANSFER_GENOTYPE_FROM_PROVIDER');
    try {
      const accessToken = yield effects.select(getAccessToken, provider,id);
      yield effects.put(startGenotypeUpload(id));
      const response = yield effects.call(transferGenotypeFromProvider, id, provider, genotypeId, accessToken);
      yield effects.put(uploadGenotypeFinished(response.genotype, response.data, id));
    } catch (error) {
      console.log(error);
      yield effects.put(genotypeUploadFailed(error, id));
    }
  }
}

function* watchLoadAvailableProviders() {
  const response = yield effects.call(loadAvailableProviders);
  yield effects.put(saveAailableProviders(response));
}


function* watchLoadAvailableTraits() {
  const response = yield effects.call(loadAvailableTraits);
  yield effects.put(saveAvailableTraits(response));
}

function createStompChannel(subscription) {
  const channel = createChannel();
  // every change event will call put on the channel
  subscription.on(channel.put);
  return channel;
}



function* rootSaga() {
  yield [
    effects.fork(watchCancelAnalysis),
    effects.fork(watchUploadGenotype),
    effects.fork(watchWebSocket),
    effects.fork(watchFinishAnalysis),
    effects.fork(watchStartAnalysis),
    effects.fork(watchLoadAvailableProviders),
    effects.fork(watchRetrieveOAuthToken),
    effects.fork(watchTransferGentoypeFromProvider),
    effects.fork(watchLoadAvailableTraits),
    effects.fork(watchStartPrediction),
  ];
}