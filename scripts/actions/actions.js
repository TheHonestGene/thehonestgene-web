const loadAnalysisData = function(analysisType) {
  return {
    type: type
  };
};

const startGenotypeUpload = function(id) {
  return {
    type: 'GENOTYPE_UPLOAD_STARTED',
    id: id,
  };
};

const uploadGenotypeFinished = function(id, data) {
  return {type: 'GENOTYPE_UPLOAD_FINISHED', id: id, data: data};
};

const genotypeUploadFailed = function(error, id) {
  return {type: 'GENOTYPE_UPLOAD_FAILED', error};
};

const startAnalysis = function(analysisType, id) {
  return {
    type: 'RUN_ANALYSIS',
    analysisType: analysisType,
    id: id,
  };
};

const displayTraitsData = function(traits, id) {
  return {
    type: 'LOAD_TRAITS_DATA',
    traits: traits,
    id: id,
  };
};

const changeStep = function(backward) {
  backward = backward || false;
  return {
    type: 'CHANGE_STEP',
    backward: backward
  };
};

const saveAailableProviders = function(data) {
  return {
    type: 'LOAD_AVAILABLE_PROVIDERS',
    data: data
  };
};

const saveAvailableTraits = function(traits) {
  return {
    type: 'LOAD_TRAITS_DATA',
    traits: traits
  };
};

const displayCloudGenotypes = function(provider, accessToken, refreshToken, code, userInfo, id) {
  return {
    type: 'DISPLAY_CLOUD_GENOTYPES',
    provider,
    accessToken,
    refreshToken,
    code,
    userInfo,
    id,
  };
};

const loadAnalysisDataFailed = function(analysisType, error, id) {
  var type;
  switch (analysisType) {
    case 'imputation':
      type = 'LOAD_IMPUTATION_DATA_FAILED';
      break;
    case 'ancestry':
      type = 'LOAD_ANCESTRY_DATA_FAILED';
      break;
    case 'riskprediction':
      type = 'LOAD_PREDICTION_DATA_FAILED';
      break;
    default:
      type = null;
  }
  return {
    type: type,
    error: error,
    id: id,
  };
};

const subscribeToUpdatesFailed = function(error, id) {
  return {type: 'SUBSCRIBE_UPDATES_FAILED', error, id};
};

const analysisFailed = function(body, id) {
  return {type: 'RUN_ANALYSIS_FAILED', body, analysisType: body.analysisType, trait: body.data, id: id}
};

const messageReceived = function(body, id) {
  return {
    type: 'MESSAGE_RECEIVED',
    body: body,
    analysisType: body.analysisType,
    trait: body.data,
    id: id,
  };
};

const analysisStarted = function(taskId, analysisType, id, trait) {
  return {type: 'RUN_ANALYSIS_STARTED', taskId, analysisType, trait, id};
};

const analysisFinished = function(body, id) {
  return {type: 'RUN_ANALYSIS_FINISHED', body, analysisType: body.analysisType, trait: body.data, id};
};

const displayAnalysisData = function(analysisType, data, id) {
  var type;
  var trait;
  switch (analysisType) {
    case 'imputation':
      type = 'DISPLAY_IMPUTATION_DATA';
      break;
    case 'ancestry':
      type = 'DISPLAY_ANCESTRY_DATA';
      break;
    case 'riskprediction':
      type = 'DISPLAY_PREDICTION_DATA';
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
};

const storeAnalysisId = function(id) {
  return {
    type: 'LOAD_ANALYSIS_ID',
    id,
  };
};

const analysisCanceled = function(id, analysisType, traits) {
  return {
    type: 'RUN_ANALYSIS_CANCELED',
    id,
    analysisType,
    trait:traits,
  }
};
