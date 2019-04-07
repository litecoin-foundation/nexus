import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import AsyncStorage from '@react-native-community/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import reducer from './src/reducers';

const initialState = {};
const middleware = [thunk];

const persistConfig = {
  key: 'root',
  storage: AsyncStorage
};
const pReducer = persistReducer(persistConfig, reducer);

export const store = createStore(pReducer, initialState, applyMiddleware(...middleware));
export const pStore = persistStore(store);
