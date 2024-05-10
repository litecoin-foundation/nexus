import {configureStore} from '@reduxjs/toolkit';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import reducer from '../reducers';
import {storage} from './mmkv';

const persistConfig = {
  key: 'root',
  storage,
  timeout: 0,
};

const pReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
  reducer: pReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export const pStore = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// completely purges store!
export const purgeStore = () => {
  pStore.purge();
};
