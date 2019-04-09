import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import thunk from 'redux-thunk';
import reducer from './src/reducers';

const initialState = {};
const middleware = [thunk];

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const storage = createSensitiveStorage({
  keychainService: 'lndmobileKeychain',
  sharedPreferencesName: 'lndmobileKeystore'
});

const persistConfig = {
  key: 'root',
  storage
};
const pReducer = persistReducer(persistConfig, reducer);

export const store = createStore(
  pReducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware))
);
export const pStore = persistStore(store);
