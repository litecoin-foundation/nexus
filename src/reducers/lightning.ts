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
import {
  subscribeStateWithTimeout,
  getLndTimeouts,
  sleepWithLog
} from '../lib/utils/lndUtils';

const PASS = 'PASSWORD';

// types
interface ILightningState {
  lndActive: boolean;
  lndStartupAttempts: number;
  lndError: string | null;
}

// initial state
const initialState = {
  lndActive: false,
  lndStartupAttempts: 0,
  lndError: null,
} as ILightningState;

// actions
const lndState = createAction<boolean>('lightning/lndState');
const incrementStartupAttempts = createAction('lightning/incrementStartupAttempts');
const setLndError = createAction<string | null>('lightning/setLndError');

// functions
export const startLnd = (): AppThunk => async (dispatch, getState) => {
  const timeouts = getLndTimeouts();
  const {lndStartupAttempts} = getState().lightning;
  
  dispatch(incrementStartupAttempts());
  dispatch(setLndError(null));
  
  console.log(`Starting LND attempt ${lndStartupAttempts + 1}`);
  
  try {
    await createConfig();

    // lnd dir path
    const appFolderPath = `${RNFS.DocumentDirectoryPath}/lndltc/`;
    console.log('LND directory:', appFolderPath);

    // start LND
    await start(` --lnddir=${appFolderPath}`);
    console.log('LND start() called successfully');

    // Use timeout wrapper for subscribeState
    const result = await subscribeStateWithTimeout({
      timeout: timeouts.startupTimeout,
      expectedStates: [WalletState.NON_EXISTING, WalletState.RPC_ACTIVE],
      maxRetries: 2,
      retryDelay: timeouts.retryDelay
    });

    if (result.success) {
      console.log('LND started successfully, setting lndActive=true');
      dispatch(lndState(true));
      dispatch(setLndError(null));
    } else {
      const error = result.timedOut 
        ? 'LND startup timed out - device may be too slow'
        : result.error || 'Unknown LND startup error';
      
      console.error('LND startup failed:', error);
      dispatch(setLndError(error));
      
      // Retry logic for slower devices
      if (lndStartupAttempts < 2) {
        console.log(`Retrying LND startup in ${timeouts.retryDelay}ms...`);
        await sleepWithLog(timeouts.retryDelay, 'LND startup retry delay');
        dispatch(startLnd());
      } else {
        console.error('Max LND startup attempts reached');
        dispatch(setLndError('Failed to start LND after multiple attempts. Device may be too slow.'));
      }
    }
  } catch (err) {
    const error = `LND startup exception: ${String(err)}`;
    console.error(error);
    dispatch(setLndError(error));
    
    // Retry on exception as well
    if (lndStartupAttempts < 2) {
      console.log(`Retrying LND startup after exception in ${timeouts.retryDelay}ms...`);
      await sleepWithLog(timeouts.retryDelay, 'LND startup exception retry delay');
      dispatch(startLnd());
    }
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
  const timeouts = getLndTimeouts();

  console.log('Initializing wallet...');
  dispatch(setLndError(null));

  const password: string = uuidv4();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();
    console.log('Wallet DB deleted successfully');

    try {
      await initLndWallet({
        cipherSeedMnemonic: seed,
        walletPassword: stringToUint8Array(password),
        recoveryWindow: beingRecovered === true ? 3000 : 0,
      });
      console.log('initLndWallet called successfully');
    } catch (error) {
      console.error('initLndWallet error:', error);
      dispatch(setLndError(`Wallet initialization failed: ${String(error)}`));
      return;
    }

    // First wait for UNLOCKED state
    console.log('Waiting for wallet UNLOCKED state...');
    const unlockedResult = await subscribeStateWithTimeout({
      timeout: timeouts.initTimeout,
      expectedStates: [WalletState.UNLOCKED],
      maxRetries: 1,
      retryDelay: timeouts.retryDelay
    });

    if (!unlockedResult.success) {
      const error = unlockedResult.timedOut 
        ? 'Wallet unlock timed out - device may be too slow'
        : unlockedResult.error || 'Unknown wallet unlock error';
      console.error('Wallet unlock failed:', error);
      dispatch(setLndError(error));
      return;
    }

    console.log('Wallet UNLOCKED, finishing onboarding...');
    dispatch(finishOnboarding());

    // Then wait for RPC_ACTIVE state
    console.log('Waiting for RPC_ACTIVE state...');
    const rpcResult = await subscribeStateWithTimeout({
      timeout: timeouts.initTimeout,
      expectedStates: [WalletState.RPC_ACTIVE],
      maxRetries: 1,
      retryDelay: timeouts.retryDelay
    });

    if (rpcResult.success) {
      console.log('RPC_ACTIVE achieved, starting pollers...');
      // RPC_ACTIVE so we are ready to dispatch pollers
      dispatch(pollInfo());
      dispatch(pollRates());
      dispatch(pollTransactions());
      dispatch(subscribeTransactions());
    } else {
      const error = rpcResult.timedOut 
        ? 'RPC activation timed out - wallet may still be syncing'
        : rpcResult.error || 'Unknown RPC activation error';
      console.warn('RPC activation issue:', error);
      // Don't set this as a critical error since onboarding already finished
    }
  } catch (error) {
    const errorMsg = `Wallet initialization exception: ${String(error)}`;
    console.error(errorMsg);
    dispatch(setLndError(errorMsg));
  }
};

export const unlockWallet = (): AppThunk => async dispatch => {
  const timeouts = getLndTimeouts();
  
  return new Promise(async (resolve, reject) => {
    console.log('Unlocking wallet...');
    dispatch(setLndError(null));
    
    const password = await getItem(PASS);

    try {
      if (password !== null) {
        await unlockLndWallet({
          walletPassword: stringToUint8Array(password),
        });
        console.log('unlockLndWallet called successfully');
      } else {
        throw new Error('wallet password is null');
      }

      // Use timeout wrapper for unlock state subscription
      const result = await subscribeStateWithTimeout({
        timeout: timeouts.unlockTimeout,
        expectedStates: [WalletState.RPC_ACTIVE],
        maxRetries: 1,
        retryDelay: timeouts.retryDelay
      });

      if (result.success) {
        console.log('Wallet unlocked successfully, RPC_ACTIVE');
        // dispatch pollers
        dispatch(pollInfo());
        dispatch(subscribeTransactions());
        dispatch(pollRates());
        dispatch(pollTransactions());
        dispatch(pollBalance());
        resolve();
      } else {
        // Check if wallet DB exists before throwing error
        const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
        
        if ((await fileExists(dbPath)) === false) {
          const error = 'Wallet database does not exist. App may need to be reinstalled.';
          console.error(error);
          dispatch(setLndError(error));
          reject(new Error(error));
        } else {
          const error = result.timedOut 
            ? 'Wallet unlock timed out - device may be too slow'
            : result.error || 'Unknown wallet unlock error';
          console.error('Wallet unlock failed:', error);
          dispatch(setLndError(error));
          reject(new Error(error));
        }
      }
    } catch (error: any) {
      if (
        error.message ===
        'rpc error: code = Unknown desc = wallet already unlocked, WalletUnlocker service is no longer available'
      ) {
        console.log('Wallet already unlocked!');
        dispatch({
          type: 'UNLOCK_WALLET',
          payload: true,
        });
        resolve();
      } else {
        const errorMsg = `Wallet unlock exception: ${String(error)}`;
        console.error(errorMsg);
        dispatch(setLndError(errorMsg));
        reject(new Error(errorMsg));
      }
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
    incrementStartupAttempts: state => ({
      ...state,
      lndStartupAttempts: state.lndStartupAttempts + 1,
    }),
    setLndError: (state, action: PayloadAction<string | null>) => ({
      ...state,
      lndError: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default lightningSlice.reducer;
