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

// uses Redux Action Logger (until devtools gets redux support)
const actionLogger =
  (_store: any) => (next: (arg0: any) => any) => (action: any) => {
    console.log('Dispatched action:', action);
    return next(action);
  };

const pReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
  reducer: pReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: {
        warnAfter: 128,
      },
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(actionLogger),
});
export const pStore = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// completely purges store!
export const purgeStore = () => {
  pStore.purge();
};
