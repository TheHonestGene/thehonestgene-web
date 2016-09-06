const getTaskId = (state,analysisType,traits) => {
  let id = getGenotypeId(state);
  if (!id) return null;
  switch (analysisType) {
    case 'imputation':
      return state.analyses[id].imputationStep.taskId;
    case 'ancestry':
      return state.analyses[id].ancestryStep.taskId;
    case 'riskprediction':
      try {
        if (traits instanceof Array) {
          const taskIds = [];
          for (let trait of traits) {
            taskIds.push(state.analyses[id].riskPredictionStep.runningAnalysis[trait].taskId);
          }
          return taskIds;
        }
        else {
          return state.analyses[id].riskPredictionStep.runningAnalysis[traits].taskId;
        }
      }catch (Error) {
        console.log('Trait not found');
      }
      return null;
    default: throw Error('Analysis ' + analysisType + ' unknown');
  }
};

const getGenotypeId = (state) => state.id;

const getAccessToken = (state,provider,id) => state.analyses[id].genotypeStep.cloudUpload.selectedProviders[provider].accessToken;
