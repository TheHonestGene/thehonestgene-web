import {LOAD_AVAILABLE_PROVIDERS} from '../actions'

export default function availableProviders(state=[],action) {
    switch (action.type) {
        case LOAD_AVAILABLE_PROVIDERS:
            return action.data;
        default:
            return state;
    }
}