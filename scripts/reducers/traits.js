import {LOAD_TRAITS_DATA} from '../actions';

export default function traits(state=[],action) {
    switch (action.type) {
        case LOAD_TRAITS_DATA:
          return action.traits;
        default:
          return state;
    }
}

export function isTraitLoaded(state=false,action) {
    switch (action.type) {
         case LOAD_TRAITS_DATA:
          return true;
        default:
          return state;
    }
}