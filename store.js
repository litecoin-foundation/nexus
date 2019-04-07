import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import reducer from './src/reducers';

const initialState = {};
const middleware = [thunk];

const storage = createSensitiveStorage({
  keychainService: 'lndmobileKeychain',
  sharedPreferencesName: 'lndmobileKeystore'
});

const persistConfig = {
  key: 'root',
  storage
};
const pReducer = persistReducer(persistConfig, reducer);

export const store = createStore(pReducer, initialState, applyMiddleware(...middleware));
export const pStore = persistStore(store);
