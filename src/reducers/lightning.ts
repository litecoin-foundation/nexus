import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';
import {Platform} from 'react-native';
import {
  start,
  initWallet as initLndWallet,
  unlockWallet as unlockLndWallet,
  subscribeState,
  stopDaemon,
} from 'react-native-turbo-lnd';
import {WalletState} from 'react-native-turbo-lnd/protos/lightning_pb';

import {AppThunk} from './types';
import {v4 as uuidv4} from 'uuid';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB, fileExists} from '../lib/utils/file';
import {finishOnboarding} from './onboarding';
import {subscribeTransactions} from './transaction';
import {pollInfo} from './info';
import {pollRates} from './ticker';
import {pollBalance} from './balance';
import {pollTransactions} from './transaction';
import {createConfig} from '../lib/utils/config';
import {stringToUint8Array} from '../lib/utils';

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
export const startLnd = (): AppThunk => async dispatch => {
  try {
    await createConfig();

    // lnd dir path
    let appFolderPath: string;
    if (Platform.OS === 'android') {
      appFolderPath = '/data/user/0/com.nexus/files/lndltc';
    } else if (Platform.OS === 'ios') {
      appFolderPath = FileSystem.documentDirectory!.replace(
        'file://',
        '',
      ).replace(/%20/g, ' ');
      appFolderPath += 'lndltc/';
    } else {
      throw new Error('LND running on Unknown OS!');
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

export const unlockWallet = (): AppThunk => async dispatch => {
  return new Promise(async resolve => {
    const password = await getItem(PASS);

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
              dispatch(subscribeTransactions());
              dispatch(pollRates());
              dispatch(pollTransactions());
              dispatch(pollBalance());

              resolve();
            }
          } catch (error) {
            const dbPath = `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/mainnet/wallet.db`;

            if ((await fileExists(dbPath)) === false) {
              // TODO: users seedphrase is no longer saved to keychain as seed is in mmkv db
              // we should on initWallet() save the seedphrase to keychain
              // then if in reinstall fetch the seed from keychain to recover from seedphrase!

              // if no wallet db exists, user has likely uninstalled the app previously
              // in this case, seed exists in keychain. initialise wallet from seed
              // enabling recovery mode to scan for addresses
              // dispatch(setRecoveryMode(true));
              // console.log('LOSHY: UNLOCKER STARTS INITWALLET!');
              // dispatch(initWallet());
              // dispatch(setRecoveryMode(false));

              // TODO: addtional handling here required
              // TODO: also need to check if seed exist prior to attempting recovery

              // resolve();
              throw new Error(
                `UNLOCKWALLET() wallet.db doesn't exist, error: ${error}`,
              );
            } else {
              throw new Error(String(error));
            }
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
});

export default lightningSlice.reducer;
