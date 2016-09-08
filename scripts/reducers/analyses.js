import { combineReducers } from 'redux';
import analysis from './analysis';
import {CREATE_NEW_ANALYSIS, CHANGE_UPLOAD_PAGE,
    GENOTYPE_UPLOAD_STARTED,GENOTYPE_UPLOAD_FINISHED,
    GENOTYPE_UPLOAD_FAILED,DISPLAY_CLOUD_GENOTYPES,
    SELECT_FILE_TO_UPLOAD,RETRIEVE_CLOUD_GENOTYPES,
    SELECT_PROVIDER,DISPLAY_IMPUTATION_DATA,
    DISPLAY_ANCESTRY_DATA,SELECT_TRAIT,START_PREDICTION,
    RUN_ANALYSIS_STARTED,DISPLAY_PREDICTION_DATA,
    RUN_ANALYSIS_CANCELED,DELETE_ANALYSIS
} from '../actions';


const genotypeSubStep = function(state='list', action) {
    switch (action.type) {
        case CREATE_NEW_ANALYSIS:
            return 'list';
        case CHANGE_UPLOAD_PAGE:
            return action.page;
        case GENOTYPE_UPLOAD_STARTED:
        case GENOTYPE_UPLOAD_FINISHED:
            return 'info';
        default:
            return state;
    }
};

const createDate = function(state = null,action) {
    switch (action.type) {
        case CREATE_NEW_ANALYSIS:
            return action.date;
        default:
            return state;
    }
}

const genotypeFile = function(state=null, action) {
    switch (action.type) {
        case SELECT_FILE_TO_UPLOAD:
            return action.file;
        default:
            return state;
    }
};

const fileUpload =  combineReducers({
    genotypeFile: genotypeFile,
});

const uploadState = function(state ={state:null,progress:0,error:null,genotypeId:null}, action) {
    switch (action.type ){
       case GENOTYPE_UPLOAD_FINISHED:
           return {state:'FINISHED',progress:100,error:null,genotypeId:action.id}
       case GENOTYPE_UPLOAD_STARTED:
           return {state:'UPLOADING',progress:1,error:null,genotypeId:null}
       case GENOTYPE_UPLOAD_FAILED:
           return {state:'ERROR',progress:1,error:action.error.message,genotypeId:null}
       default:
           return state;
    }
}

const selectedProviders = function(state={},action) {
    var provider;
    switch (action.type) {
        case RETRIEVE_CLOUD_GENOTYPES:
            provider = action.provider;
            state = {};
            state[provider] = {code:action.code};
            return state;
        case DISPLAY_CLOUD_GENOTYPES:
            state = Object.assign({},state);
            provider = action.provider;
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
        case SELECT_PROVIDER:
        case DISPLAY_CLOUD_GENOTYPES:
            return action.provider;
        default:
            return state;
    }
}

const cloudUpload = combineReducers({
    selectedProviders: selectedProviders,
    currentProvider: currentProvider
});

const displayGenotypeData = function(state=null,action) {
    switch (action.type) {
        case GENOTYPE_UPLOAD_FINISHED:
            return action.data;
        default:
          return state;
    }
}

const genotypeStep = combineReducers({
    step:genotypeSubStep,
    fileUpload: fileUpload,
    cloudUpload: cloudUpload,
    uploadState: uploadState,
    data: displayGenotypeData
});


const imputationData = function(state=null, action) {
    switch (action.type) {
        case DISPLAY_IMPUTATION_DATA:
            return action.data;
        default:
            return state;
    }
};

const imputationStep = function(state, action) {
    return analysis(state, action, imputationData, 'imputation');
};

const ancestryData = function(state =null, action) {
    switch (action.type) {
        case DISPLAY_ANCESTRY_DATA:
            return action.data;
        default:
            return state;
    }
};

const ancestryStep = function(state, action) {
    return analysis(state, action, ancestryData, 'ancestry');
};

const selectedTraits = function(state={},action) {
    switch (action.type) {
        case SELECT_TRAIT:
            state = Object.assign({},state);
            if (action.isChecked) {
                state[action.name] = {};
            }
            else {
                delete state[action.name];
            }
            return state;
        case START_PREDICTION:
            state = Object.assign({},state);
            for (let i=0;i<action.traits.length;i++) {
                let trait = action.traits[i];
                delete state[trait];
            }
            return state;
        case RUN_ANALYSIS_STARTED:
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





const predictionData = function(state =null,action) {
    switch (action.type) {
        case DISPLAY_PREDICTION_DATA:
            return action.data;
        default:
            return state;
    }
}


const runningAnalysis= function(state= {},action) {
    if ((action.analysisType && action.analysisType === 'riskprediction') || action.type === DISPLAY_PREDICTION_DATA) {
        if (action.trait) {
            state = Object.assign({},state);
            if (action.trait instanceof Array) {
                for (let t of action.trait) {
                    if (action.type === RUN_ANALYSIS_CANCELED) {
                        delete state[t];
                    }
                    else {
                        state[t] = analysis(state[t],action,predictionData,action.analysisType);
                    }
                }
            } else {
                if (action.type === RUN_ANALYSIS_CANCELED) {
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

const riskPredictionStep = combineReducers({
    selectedTraits,
    runningAnalysis
}); 


const singleAnalysis = combineReducers({
    date: createDate,
    genotypeStep: genotypeStep,
    imputationStep: imputationStep,
    ancestryStep: ancestryStep,
    riskPredictionStep: riskPredictionStep,
})

export default function analyses(state,action) {
   state = state || {}
   switch (action.type) {
       case CREATE_NEW_ANALYSIS:
          state = {...state};
          state[action.id] = singleAnalysis({},action);
          return state;
       case DELETE_ANALYSIS:
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
}