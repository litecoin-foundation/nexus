import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {
  start,
  initWallet as initLndWallet,
  unlockWallet as unlockLndWallet,
  subscribeState,
  stopDaemon,
  WalletState,
} from 'react-native-nitro-lndltc';
import type {Subscription} from 'react-native-nitro-lndltc';
import * as RNFS from '@dr.pogodin/react-native-fs';

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
import {resetPincode, unlockWalletAction} from './authentication';
import {resetToLoading} from '../navigation/NavigationService';

const PASS = 'PASSWORD';
const RESCAN_FLAG = 'RESCAN_WALLET_TRANSACTIONS';

// Single state subscription — stored to prevent GC
let _stateSub: Subscription | null = null;
let _pollersStarted = false;

// types
interface ILightningState {
  lndActive: boolean;
  walletState: WalletState | null;
  isRescanningWallet: boolean;
}

// initial state
const initialState = {
  lndActive: false,
  walletState: null,
  isRescanningWallet: false,
} as ILightningState;

// actions
const lndState = createAction<boolean>('lightning/lndState');
const setWalletState = createAction<WalletState | null>(
  'lightning/setWalletState',
);
export const setRescanningWallet = createAction<boolean>(
  'lightning/setRescanningWallet',
);

// functions
export const startLnd = (): AppThunk => async (dispatch, getState) => {
  try {
    const {torEnabled, litecoinBackend} = getState().settings;
    await createConfig(torEnabled, litecoinBackend);

    // lnd dir path
    const appFolderPath = `${RNFS.DocumentDirectoryPath}/lndltc/`;

    // check if wallet.db is missing - if so, clean up stale macaroons before starting LND
    const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
    const walletExists = await fileExists(dbPath);

    if (!walletExists) {
      await deleteMacaroonFiles();
    }

    // check if we need to rescan wallet transactions
    const needsRescan = await getItem(RESCAN_FLAG);
    let startFlags = ` --lnddir=${appFolderPath}`;

    if (needsRescan === 'true') {
      startFlags += ' --reset-wallet-transactions';
      console.log('Starting LND with --reset-wallet-transactions flag');
    }

    // start LND
    await start(startFlags);

    // Single state subscription for the entire app lifecycle
    _stateSub = subscribeState(
      async response => {
        dispatch(setWalletState(response.state));

        if (response.state === WalletState.NON_EXISTING) {
          dispatch(lndState(true));
        } else if (response.state === WalletState.LOCKED) {
          dispatch(lndState(true));
        } else if (response.state === WalletState.UNLOCKED) {
          dispatch(lndState(true));

          // During onboarding, UNLOCKED means wallet was just created
          const {isOnboarded} = getState().onboarding!;
          if (!isOnboarded) {
            dispatch(finishOnboarding());
          }
        } else if (
          response.state === WalletState.RPC_ACTIVE ||
          response.state === WalletState.SERVER_ACTIVE
        ) {
          dispatch(lndState(true));

          // Start pollers once
          if (!_pollersStarted) {
            _pollersStarted = true;

            dispatch(pollInfo());
            if (getState().settings.litecoinBackend !== 'electrum') {
              dispatch(pollPeers());
            }
            dispatch(pollRates());
            dispatch(pollTransactions());
            dispatch(subscribeTransactions());
            dispatch(pollBalance());

            dispatch(unlockWalletAction);
          }

          // Clear rescan flag if needed
          if (needsRescan === 'true') {
            await setItem(RESCAN_FLAG, 'false');
            console.log('wallet rescan flag cleared, rescanning in progress');
          }
        }
      },
      error => {
        console.error('subscribeState error:', error);
      },
    );
  } catch (err) {
    console.error('CANT start LND');
    console.error(err);
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await stopDaemon();
  } catch (err) {
    console.error('STOPLND: Error calling stopDaemon:', err);
  }

  _stateSub?.cancel();
  _stateSub = null;
  _pollersStarted = false;

  dispatch(lndState(false));
  dispatch(setWalletState(null));
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
    await initLndWallet({
      cipherSeedMnemonic: seed,
      walletPassword: stringToUint8Array(password),
      recoveryWindow: beingRecovered === true ? 3000 : 0,
    });
  } catch (error) {
    console.error(error);
  }
};

export const unlockWallet = (): AppThunk => async (dispatch, getState) => {
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
  } catch (error: any) {
    if (
      error.message ===
      'rpc error: code = Unknown desc = wallet already unlocked, WalletUnlocker service is no longer available'
    ) {
      console.log('wallet unlocked already!');
    } else {
      throw new Error(String(error));
    }
  }
};

export const rescanWallet = (): AppThunk => async dispatch => {
  try {
    console.log('RESCAN: Start wallet rescan');
    // Set flag to rescan on next LND start
    dispatch(setRescanningWallet(true));
    await setItem(RESCAN_FLAG, 'true');

    // Stop LND
    console.log('RESCAN: Stopping LND');
    await dispatch(stopLnd());
    console.log('RESCAN: LND has been stopped');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start LND (which will now include --reset-wallet-transactions flag)
    console.log('RESCAN: Starting LND with rescan flag');
    await dispatch(startLnd());
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('RESCAN: Auto-unlock wallet');
    await dispatch(unlockWallet());
  } catch (error) {
    console.error('RESCAN: Error during wallet rescan:', error);
    dispatch(setRescanningWallet(false));
    await setItem(RESCAN_FLAG, 'false');
    throw error;
  }
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
    setWalletState: (state, action: PayloadAction<WalletState | null>) => ({
      ...state,
      walletState: action.payload,
    }),
    setRescanningWallet: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isRescanningWallet: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default lightningSlice.reducer;
