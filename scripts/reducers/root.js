const steps = ['genotype','imputation','ancestry','predictions'];

const genotypeSubStep = function(state='list', action) {
    switch (action.type) {
        case 'CREATE_NEW_ANALYSIS':
            return 'list';
        case 'CHANGE_UPLOAD_PAGE':
            return action.page;
        case 'GENOTYPE_UPLOAD_STARTED':
        case 'GENOTYPE_UPLOAD_FINISHED':
            return 'info';
        default:
            return state;
    }
};


const currentStep = function(state ='start', action) {
    switch (action.type) {
        case 'LOAD_ANALYSIS':
            if (action.step) {
              return action.step;
            }
            return 'genotype';
        case 'CHANGE_CURRENT_STEP':
            return action.step;
        case 'CHANGE_STEP':
           var currentIndex = steps.indexOf(state);
           if ((currentIndex == 0 && action.backward) || (currentIndex == 4 && !action.backward))
              return state;
           return steps[action.backward ? --currentIndex : ++currentIndex];
        default:
            return state;
    }
};

const genotypeFile = function(state=null, action) {
    switch (action.type) {
        case 'SELECT_FILE_TO_UPLOAD':
            return action.file;
        default:
            return state;
    }
};


const fileUpload =  Redux.combineReducers({
    genotypeFile: genotypeFile,
});


const displayGenotypeData = function(state=null,action) {
    switch (action.type) {
        case 'GENOTYPE_UPLOAD_FINISHED':
            return action.data;
        default:
          return state;
    }
}

const availableProviders = function(state=[],action) {
    switch (action.type) {
        case 'LOAD_AVAILABLE_PROVIDERS':
            return action.data;
        default:
            return state;
    }
}

const selectedProviders = function(state={},action) {
    switch (action.type) {
        case 'RETRIEVE_CLOUD_GENOTYPES':
            var provider = action.provider;
            state = {};
            state[provider] = {code:action.code};
            return state;
        case 'DISPLAY_CLOUD_GENOTYPES':
            state = Object.assign({},state);
            var provider = action.provider;
            state[provider] = {};
            state[provider].code = action.code;
            state[provider].accessToken = action.accessToken;
            state[provider].refreshToken = action.refreshToken;
            state[provider].userInfo = action.userInfo;
            return state;
        default:
          return state;
    }
}

const currentProvider = function(state=null,action) {
    switch (action.type) {
        case 'SELECT_PROVIDER':
        case 'DISPLAY_CLOUD_GENOTYPES':
            return action.provider;
        default:
            return state;
    }
}

const cloudUpload = Redux.combineReducers({
    selectedProviders: selectedProviders,
    currentProvider: currentProvider
});


const uploadState = function(state ={state:null,progress:0,error:null,genotypeId:null}, action) {
    switch (action.type ){
       case 'GENOTYPE_UPLOAD_FINISHED':
           return {state:'FINISHED',progress:100,error:null,genotypeId:action.id}
       case 'GENOTYPE_UPLOAD_STARTED':
           return {state:'UPLOADING',progress:1,error:null,genotypeId:null}
       case 'GENOTYPE_UPLOAD_FAILED':
           return {state:'ERROR',progress:1,error:action.error.message,genotypeId:null}
       default:
           return state;
    }
}

const analysisId = function(state = null,action) {
    switch (action.type) {
        case 'LOAD_ANALYSIS':
            return action.id;
        case 'CHANGE_CURRENT_STEP':
            if (action.step === 'start') {
                return null;
            }
            return state;
        case 'DELETE_ANALYSIS':
            if (action.id === state) {
                return null;
            }
            return state
        default:
            return state;
    }
}



const genotypeStep = Redux.combineReducers({
    step:genotypeSubStep,
    fileUpload: fileUpload,
    cloudUpload: cloudUpload,
    uploadState: uploadState,
    data: displayGenotypeData
});

const predictionData = function(state =null,action) {
    switch (action.type) {
        case 'DISPLAY_PREDICTION_DATA':
            return action.data;
        default:
            return state;
    }
}

const imputationData = function(state=null, action) {
    switch (action.type) {
        case 'DISPLAY_IMPUTATION_DATA':
            return action.data;
        default:
            return state;
    }
};

const runAnalysis = function(state = null, action, analysisType) {
    switch (action.type) {
        case 'RUN_ANALYSIS_STARTED':
            if (analysisType == action.analysisType) {
                return action.taskId;
            }
        default:
            return state;
    }
};

const ancestryData = function(state =null, action) {
    switch (action.type) {
        case 'DISPLAY_ANCESTRY_DATA':
            return action.data;
        default:
            return state;
    }
};

const riskpredictionData = function(state =null, action) {
    switch (action.type) {
        case 'DISPLAY_PREDICTION_DATA':
            return action.data;
        default:
            return state;
    }
};

const imputationStep = function(state, action) {
    return analysis(state, action, imputationData, 'imputation');
};

const ancestryStep = function(state, action) {
    return analysis(state, action, ancestryData, 'ancestry');
};


const traits = function(state=[],action) {
    switch (action.type) {
        case 'LOAD_TRAITS_DATA':
          return action.traits;
        default:
          return state;
    }
}

const isTraitLoaded  = function(state=false,action) {
    switch (action.type) {
         case 'LOAD_TRAITS_DATA':
          return true;
        default:
          return state;
    }
}

const selectedTraits = function(state={},action) {
    switch (action.type) {
        case 'SELECT_TRAIT':
            state = Object.assign({},state);
            if (action.isChecked) {
                state[action.name] = {};
            }
            else {
                delete state[action.name];
            }
            return state;
        case 'START_PREDICTION':
            state = Object.assign({},state);
            for (let i=0;i<action.traits.length;i++) {
                let trait = action.traits[i];
                delete state[trait];
            }
            return state;
        case 'RUN_ANALYSIS_STARTED':
            if (action.analysisType === 'riskprediction') {
                state = Object.assign({},state);
                if (action.trait in state) {
                    delete state[action.trait];
                }
            }
            return state;
        default:
            return state;

    }
}

var runningSingleAnalysis = function(state,action) {

}

const runningAnalysis= function(state= {},action) {
    if ((action.analysisType && action.analysisType === 'riskprediction') || action.type === 'DISPLAY_PREDICTION_DATA') {
        if (action.trait) {
            state = Object.assign({},state);
            if (action.trait instanceof Array) {
                for (let t of action.trait) {
                    if (action.type === 'RUN_ANALYSIS_CANCELED') {
                        delete state[t];
                    }
                    else {
                        state[t] = analysis(state[t],action,predictionData,action.analysisType);
                    }
                }
            } else {
                if (action.type === 'RUN_ANALYSIS_CANCELED') {
                    delete state[action.trait];
                }
                else {
                    state[action.trait] = analysis(state[action.trait],action,predictionData,action.analysisType);
                }
            }
        }
    }
    return state;
}


const riskPredictionStep = Redux.combineReducers({
    selectedTraits,
    runningAnalysis
});


const analysis = function(state, action, dataReducer, analysisType) {
    state = state || { state: null, data: null, taskId: null };
    return {
        state: messageReducer(state.state, action, analysisType),
        data: dataReducer(state.data, action),
        taskId: runAnalysis(state.taskId, action, analysisType)
    }
}

const messageReducer = function(state, action, analysisType) {
    state = state || { state: null, progress: null, task: null, analysisType: analysisType }
    switch (action.type) {
        case 'MESSAGE_RECEIVED':
            if (analysisType == action.analysisType) {
                return action.body;
            }
            return state;
        case 'RUN_ANALYSIS_FINISHED':
            if (analysisType == action.analysisType) {
                return { state: 'FINISHED', progress: 100, task: "Finished", analysisType: analysisType };
            }
            return state;
        case 'RUN_ANALYSIS_FAILED':
            if (analysisType == action.analysisType) {
                return { state: 'ERROR', progress: 0, task: "Failed", analysisType: analysisType,error:action.error };
            }
        case 'RUN_ANALYSIS_CANCELED':
            if (analysisType == action.analysisType) {
                state = {...state,task: 'Canceled by user'};
                state['state'] = 'CANCELED';
                return state;
            }
        default:
            return state;
    }
};

const analyses = function(state,action) {
   state = state || {}
   switch (action.type) {
       case 'CREATE_NEW_ANALYSIS':
          state = {...state};
          state[action.id] = singleAnalysis({},action);
          return state;
       case 'DELETE_ANALYSIS':
          state = {...state};
          delete state[action.id];
          return state;
       default:
          if (action.id && action.id in state) {
             state = {...state};
             state[action.id] = singleAnalysis(state[action.id],action);
          }
          return state;
   }
};

const createDate = function(state = null,action) {
    switch (action.type) {
        case 'CREATE_NEW_ANALYSIS':
            return action.date;
        default:
            return state;
    }
}

const singleAnalysis = Redux.combineReducers({
    date: createDate,
    genotypeStep: genotypeStep,
    imputationStep: imputationStep,
    ancestryStep: ancestryStep,
    riskPredictionStep: riskPredictionStep,
})

const rootReducer = Redux.combineReducers({
    id: analysisId,
    availableProviders,
    isTraitLoaded,
    traits,
    currentStep,
    analyses,
});