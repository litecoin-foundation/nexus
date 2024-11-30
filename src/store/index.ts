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

// Redux cannot serialise BigInt so instead we convert BigInt to string
// All strings containing Integer-likes will be deserialised as BigInt!
const bigIntSerializer = {
  serializableTransform: {
    in: (value: any) => {
      // Serialize BigInt as string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    },
    out: (value: any) => {
      // convert string back to BigInt when reading from the store
      if (typeof value === 'string' && /^-?\d+$/.test(value)) {
        return BigInt(value);
      }
      return value;
    },
  },
};

export const store = configureStore({
  reducer: pReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: {
        warnAfter: 128,
      },
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ...bigIntSerializer,
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
