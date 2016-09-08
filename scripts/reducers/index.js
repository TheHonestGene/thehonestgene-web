import { combineReducers } from 'redux';
import availableProviders from './providers';
import analyses from './analyses';
import traits, {isTraitLoaded} from './traits';
import {LOAD_ANALYSIS,CHANGE_CURRENT_STEP,DELETE_ANALYSIS, CHANGE_STEP} from '../actions';

export const steps =  ['genotype','imputation','ancestry','predictions'];


const analysisId = function(state = null,action) {
    switch (action.type) {
        case LOAD_ANALYSIS:
            return action.id;
        case CHANGE_CURRENT_STEP:
            if (action.step === 'start') {
                return null;
            }
            return state;
        case DELETE_ANALYSIS:
            if (action.id === state) {
                return null;
            }
            return state
        default:
            return state;
    }
}

const currentStep = function(state ='start', action) {
    switch (action.type) {
        case LOAD_ANALYSIS:
            if (action.step) {
              return action.step;
            }
            return 'genotype';
        case CHANGE_CURRENT_STEP:
            return action.step;
        case CHANGE_STEP:
           var currentIndex = steps.indexOf(state);
           if ((currentIndex == 0 && action.backward) || (currentIndex == 4 && !action.backward))
              return state;
           return steps[action.backward ? --currentIndex : ++currentIndex];
        default:
            return state;
    }
};


const reducer = combineReducers({
    id: analysisId,
    availableProviders,
    isTraitLoaded,
    traits,
    currentStep,
    analyses,
});

export default reducer;