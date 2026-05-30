import {configureStore} from '@reduxjs/toolkit';
import * as RNFS from '@dr.pogodin/react-native-fs';

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
import {getBalance} from '../reducers/balance';
import {clearTransactionCache, getTransactions} from '../reducers/transaction';

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

// When the active wallet changes, the single shared balance/transaction view is
// stale for the newly-selected wallet. Drive off an actual selectedWalletId
// change so this covers both selectWallet AND removing the currently-selected HW
// wallet (which resets the selection to Main). Persist rehydrate/purge are
// excluded so we never wipe just-restored data or refetch during logout.
const walletSwitchMiddleware =
  (storeApi: any) => (next: (arg0: any) => any) => (action: any) => {
    const previousWalletId = storeApi.getState().wallets?.selectedWalletId;
    const result = next(action);
    const nextWalletId = storeApi.getState().wallets?.selectedWalletId;
    if (
      nextWalletId !== previousWalletId &&
      action?.type !== PURGE &&
      action?.type !== REHYDRATE
    ) {
      storeApi.dispatch(clearTransactionCache());
      storeApi.dispatch(getBalance());
      storeApi.dispatch(getTransactions());
    }
    return result;
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
    }).concat(actionLogger, walletSwitchMiddleware),
});
export const pStore = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// completely purges store!
export const purgeStore = async () => {
  pStore.purge();
  await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/mmkv/`);
};
