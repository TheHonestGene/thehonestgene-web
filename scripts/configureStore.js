var initialState = undefined;
let persistedState = localStorage.getItem('thehonestgene')
if (persistedState !== null) {
  initialState = JSON.parse(persistedState);
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const persistState = debounce(function() {
    localStorage.setItem('thehonestgene',JSON.stringify(store.getState()));
}, 1000);


const createSagaMiddleware = ReduxSaga.default;
const sagaMiddleware = createSagaMiddleware();

var store = Redux.createStore(rootReducer,initialState,
    Redux.compose(
        Redux.applyMiddleware(sagaMiddleware),
        window.devToolsExtension ? window.devToolsExtension() : f => f));

sagaMiddleware.run(rootSaga);

store.subscribe(()=> {
  persistState();
});