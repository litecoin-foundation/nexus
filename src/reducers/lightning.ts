import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {
  start,
  initWallet as initLndWallet,
  unlockWallet as unlockLndWallet,
  subscribeState,
  stopDaemon,
} from 'react-native-turbo-lndltc';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {WalletState} from 'react-native-turbo-lndltc/protos/lightning_pb';

import {AppThunk} from './types';
import {v4 as uuidv4} from 'uuid';
import {setItem, getItem} from '../utils/keychain';
import {
  deleteWalletDB,
  deleteLNDDir,
  deleteMacaroonFiles,
  fileExists,
} from '../utils/file';
import {finishOnboarding, setRecoveryMode} from './onboarding';
import {subscribeTransactions} from './transaction';
import {pollInfo, pollPeers} from './info';
import {pollRates} from './ticker';
import {pollBalance} from './balance';
import {pollTransactions} from './transaction';
import {createConfig} from '../utils/config';
import {stringToUint8Array} from '../utils';
import {purgeStore} from '../store';
import {resetPincode} from './authentication';
import {resetToLoading} from '../navigation/NavigationService';

const PASS = 'PASSWORD';

// types
interface ILightningState {
  lndActive: boolean;
}

// initial state
const initialState = {
  lndActive: false,
} as ILightningState;

// actions
const lndState = createAction<boolean>('lightning/lndState');

// functions
export const startLnd = (): AppThunk => async (dispatch, getState) => {
  try {
    const {torEnabled, litecoinBackend} = getState().settings;
    await createConfig(torEnabled, litecoinBackend);

    // lnd dir path
    const appFolderPath = `${RNFS.DocumentDirectoryPath}/lndltc/`;

    // check if wallet.db is missing - if so, clean up stale macaroons before starting LND
    //
    // when unlockWallet() is called, if wallet.db doesn't exist, initWallet() will be called
    // but lnd connections will fail due to existing macaroon. so we clean up macaroons
    const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
    const walletExists = await fileExists(dbPath);

    if (!walletExists) {
      await deleteMacaroonFiles();
    }

    // start LND
    await start(` --lnddir=${appFolderPath}`);

    // set lndActive when RPC is ready!
    subscribeState(
      {},
      async state => {
        if (state.state === WalletState.NON_EXISTING) {
          dispatch(lndState(true));
        } else if (state.state === WalletState.RPC_ACTIVE) {
          dispatch(lndState(true));
        }
        try {
        } catch (error) {
          throw new Error(String(error));
        }
      },
      error => {
        console.error('LOSHY: ', error);
      },
    );
  } catch (err) {
    console.error('CANT start LND');
    console.error(err);

    // TODO: handle this
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await stopDaemon({});
    subscribeState(
      {},
      async _ => {
        try {
        } catch (error) {
          throw new Error(String(error));
        }
      },
      error => {
        if (error.includes('error reading from server')) {
          dispatch(lndState(false));
          return;
        }
      },
    );
  } catch (err) {
    console.error('CANT stop LND');
    console.error(err);
    // TODO: handle this
  }
};

export const resetLndState = (): AppThunk => async dispatch => {
  dispatch(lndState(false));
};

export const initWallet = (): AppThunk => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding!;

  const password: string = uuidv4();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();

    try {
      await initLndWallet({
        cipherSeedMnemonic: seed,
        walletPassword: stringToUint8Array(password),
        recoveryWindow: beingRecovered === true ? 3000 : 0,
      });
    } catch (error) {
      console.error(error);
    }

    subscribeState(
      {},
      async state => {
        try {
          if (state.state === WalletState.UNLOCKED) {
            // UNLOCKED is before RPC_ACTIVE
            // we know that onboarding is finished by now!
            // when isOnboarded, the Welcome screen will initWallet()
            // and handle navigation
            dispatch(finishOnboarding());
          } else if (state.state === WalletState.RPC_ACTIVE) {
            // RPC_ACTIVE so we are ready to dispatch pollers
            dispatch(pollInfo());
            dispatch(pollPeers());
            dispatch(pollRates());
            dispatch(pollTransactions());
            dispatch(subscribeTransactions());

            return;
          }
        } catch (error) {
          throw new Error(String(error));
        }
      },
      error => {
        console.error(error);
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const unlockWallet = (): AppThunk => async (dispatch, getState) => {
  return new Promise(async resolve => {
    let password = await getItem(PASS);

    const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;

    // check if wallet exists, otherwise initWallet
    if ((await fileExists(dbPath)) === false) {
      const {seed} = getState().onboarding!;

      if (seed && seed.length > 0) {
        // wallet.db missing but seed phrase exists - attempting recovery
        try {
          dispatch(setRecoveryMode(true));
          await dispatch(initWallet());
          dispatch(setRecoveryMode(false));

          // Get the new password generated during initWallet to avoid race condition
          password = await getItem(PASS);

          resolve();
          return;
        } catch (recoveryError) {
          console.error('Failed to recover wallet from seed:', recoveryError);
          dispatch(setRecoveryMode(false));
          return;
        }
      } else {
        // No seed phrase available - trigger complete wallet reset
        await dispatch(handleWalletReset());
        return;
      }
    }

    try {
      if (password !== null) {
        await unlockLndWallet({
          walletPassword: stringToUint8Array(password),
        });
      } else {
        throw new Error('wallet password is null');
      }

      subscribeState(
        {},
        async state => {
          try {
            if (state.state === WalletState.RPC_ACTIVE) {
              // dispatch pollers
              dispatch(pollInfo());
              dispatch(pollPeers());
              dispatch(subscribeTransactions());
              dispatch(pollRates());
              dispatch(pollTransactions());
              dispatch(pollBalance());

              resolve();
            }
          } catch (error) {
            throw new Error(String(error));
          }
        },
        error => {
          console.error(String(error));
        },
      );
    } catch (error: any) {
      if (
        error.message ===
        'rpc error: code = Unknown desc = wallet already unlocked, WalletUnlocker service is no longer available'
      ) {
        console.log('wallet unlocked already!');
        dispatch({
          type: 'UNLOCK_WALLET',
          payload: true,
        });
      }
      throw new Error(String(error));
    }
  });
};

export const handleWalletReset = (): AppThunk => async dispatch => {
  try {
    await dispatch(resetPincode());
    await purgeStore();
    await deleteLNDDir();

    resetToLoading();
  } catch (error) {
    console.error('Error during wallet reset:', error);
    throw error;
  }
};

// slicer
export const lightningSlice = createSlice({
  name: 'lightning',
  initialState,
  reducers: {
    lndState: (state, action: PayloadAction<boolean>) => ({
      ...state,
      lndActive: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default lightningSlice.reducer;
