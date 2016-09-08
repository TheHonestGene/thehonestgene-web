export const DELETE_ANALYSIS = 'DELETE_ANALYSIS';
export const CHANGE_CURRENT_STEP = 'CHANGE_CURRENT_STEP';
export const LOAD_ANALYSIS = 'LOAD_ANALYSIS';
export const CHANGE_UPLOAD_PAGE = 'CHANGE_UPLOAD_PAGE';
export const CREATE_NEW_ANALYSIS = 'CREATE_NEW_ANALYSIS';
export const SELECT_FILE_TO_UPLOAD = 'SELECT_FILE_TO_UPLOAD';
export const RETRIEVE_CLOUD_GENOTYPES = 'RETRIEVE_CLOUD_GENOTYPES';
export const SELECT_PROVIDER = 'SELECT_PROVIDER';
export const START_PREDICTION = 'START_PREDICTION';
export const SELECT_TRAIT = 'SELECT_TRAIT';

export const GENOTYPE_UPLOAD_STARTED = 'GENOTYPE_UPLOAD_STARTED';

export function startGenotypeUpload(id) {
  return {
    type: GENOTYPE_UPLOAD_STARTED,
    id: id,
  };
}

export const GENOTYPE_UPLOAD_FINISHED = 'GENOTYPE_UPLOAD_FINISHED';

export function uploadGenotypeFinished(id, data) {
  return {type: GENOTYPE_UPLOAD_FINISHED, id: id, data: data};
}

export const GENOTYPE_UPLOAD_FAILED = 'GENOTYPE_UPLOAD_FAILED'

export function genotypeUploadFailed(error, id) {
  return {type: GENOTYPE_UPLOAD_FAILED, error, id};
}


export const RUN_ANALYSIS = 'RUN_ANALYSIS';
export function startAnalysis(analysisType, id) {
  return {
    type: RUN_ANALYSIS,
    analysisType: analysisType,
    id: id,
  };
}

export const LOAD_TRAITS_DATA = 'LOAD_TRAITS_DATA';

export function saveAvailableTraits(traits) {
  return {
    type: LOAD_TRAITS_DATA,
    traits: traits
  };
}

export function displayTraitsData(traits, id) {
  return {
    type: LOAD_TRAITS_DATA,
    traits: traits,
    id: id,
  };
}

export const CHANGE_STEP = 'CHANGE_STEP';

export function changeStep(backward) {
  backward = backward || false;
  return {
    type: CHANGE_STEP,
    backward: backward
  };
}

export const LOAD_AVAILABLE_PROVIDERS = 'LOAD_AVAILABLE_PROVIDERS';

export function saveAailableProviders(data) {
  return {
    type: LOAD_AVAILABLE_PROVIDERS,
    data: data
  };
}


export const DISPLAY_CLOUD_GENOTYPES = 'DISPLAY_CLOUD_GENOTYPES';

export function displayCloudGenotypes(provider, accessToken, refreshToken, code, userInfo, id) {
  return {
    type: DISPLAY_CLOUD_GENOTYPES,
    provider,
    accessToken,
    refreshToken,
    code,
    userInfo,
    id,
  };
}

export const LOAD_IMPUTATION_DATA_FAILED = 'LOAD_IMPUTATION_DATA_FAILED';
export const LOAD_ANCESTRY_DATA_FAILED = 'LOAD_ANCESTRY_DATA_FAILED';
export const LOAD_PREDICTION_DATA_FAILED = 'LOAD_PREDICTION_DATA_FAILED';

export function loadAnalysisDataFailed(analysisType, error, id) {
  var type;
  switch (analysisType) {
    case 'imputation':
      type = LOAD_IMPUTATION_DATA_FAILED;
      break;
    case 'ancestry':
      type = LOAD_ANCESTRY_DATA_FAILED;
      break;
    case 'riskprediction':
      type = LOAD_PREDICTION_DATA_FAILED;
      break;
    default:
      type = null;
  }
  return {
    type: type,
    error: error,
    id: id,
  };
}

export const SUBSCRIBE_UPDATES_FAILED = 'SUBSCRIBE_UPDATES_FAILED';

export function subscribeToUpdatesFailed(error, id) {
  return {type: SUBSCRIBE_UPDATES_FAILED, error, id};
}

export const RUN_ANALYSIS_FAILED = 'RUN_ANALYSIS_FAILED';

export function analysisFailed(body, id) {
  return {type: RUN_ANALYSIS_FAILED, body, analysisType: body.analysisType, trait: body.data, id: id}
}

export const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';

export function messageReceived(body, id) {
  return {
    type: MESSAGE_RECEIVED,
    body: body,
    analysisType: body.analysisType,
    trait: body.data,
    id: id,
  };
}

export const RUN_ANALYSIS_STARTED = 'RUN_ANALYSIS_STARTED';

export function analysisStarted(taskId, analysisType, id, trait) {
  return {type: RUN_ANALYSIS_STARTED, taskId, analysisType, trait, id};
}

export const RUN_ANALYSIS_FINISHED = 'RUN_ANALYSIS_FINISHED';

export function analysisFinished(body, id) {
  return {type: RUN_ANALYSIS_FINISHED, body, analysisType: body.analysisType, trait: body.data, id};
}

export const DISPLAY_IMPUTATION_DATA = 'DISPLAY_IMPUTATION_DATA';
export const DISPLAY_ANCESTRY_DATA = 'DISPLAY_ANCESTRY_DATA';
export const DISPLAY_PREDICTION_DATA = 'DISPLAY_PREDICTION_DATA';

export function displayAnalysisData(analysisType, data, id) {
  var type;
  var trait;
  switch (analysisType) {
    case 'imputation':
      type = DISPLAY_IMPUTATION_DATA;
      break;
    case 'ancestry':
      type = DISPLAY_ANCESTRY_DATA;
      break;
    case 'riskprediction':
      type = DISPLAY_PREDICTION_DATA;
      trait = data.trait;
      break;
    default:
      type = null;
  }
  return {
    type,
    data,
    trait,
    id
  };
}

export const LOAD_ANALYSIS_ID = 'LOAD_ANALYSIS_ID';

export function storeAnalysisId(id) {
  return {
    type: LOAD_ANALYSIS_ID,
    id,
  };
}

export const RUN_ANALYSIS_CANCELED = 'RUN_ANALYSIS_CANCELED';

export function analysisCanceled(id, analysisType, traits) {
  return {
    type: RUN_ANALYSIS_CANCELED,
    id,
    analysisType,
    trait:traits,
  }
}