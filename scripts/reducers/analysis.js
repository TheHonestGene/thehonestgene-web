import {MESSAGE_RECEIVED,
    RUN_ANALYSIS_FINISHED,RUN_ANALYSIS_FAILED,
    RUN_ANALYSIS_CANCELED, RUN_ANALYSIS_STARTED} from '../actions';

const messageReducer = function(state, action, analysisType) {
    state = state || { state: null, progress: null, task: null, analysisType: analysisType }
    switch (action.type) {
        case MESSAGE_RECEIVED:
            if (analysisType == action.analysisType) {
                return action.body;
            }
            return state;
        case RUN_ANALYSIS_FINISHED:
            if (analysisType == action.analysisType) {
                return { state: 'FINISHED', progress: 100, task: "Finished", analysisType: analysisType };
            }
            return state;
        case RUN_ANALYSIS_FAILED:
            if (analysisType == action.analysisType) {
                return { state: 'ERROR', progress: 0, task: "Failed", analysisType: analysisType,error:action.error };
            }
            return state;
        case RUN_ANALYSIS_CANCELED:
            if (analysisType == action.analysisType) {
                state = {...state,task: 'Canceled by user'};
                state['state'] = 'CANCELED';
                return state;
            }
            return state;
        default:
            return state;
    }
};


const runAnalysis = function(state = null, action, analysisType) {
    switch (action.type) {
        case RUN_ANALYSIS_STARTED:
            if (analysisType == action.analysisType) {
                return action.taskId;
            }
            break;
        default:
            return state;
    }
};

export default function analysis(state, action, dataReducer, analysisType) {
    state = state || { state: null, data: null, taskId: null };
    return {
        state: messageReducer(state.state, action, analysisType),
        data: dataReducer(state.data, action),
        taskId: runAnalysis(state.taskId, action, analysisType)
    }
}