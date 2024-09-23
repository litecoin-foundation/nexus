import * as Lnd from '../lib/lightning';
import * as LndWallet from '../lib/lightning/wallet';
import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';
import {NativeModules} from 'react-native';

import {AppThunk} from './types';
import {v4 as uuidv4} from 'uuid';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB, fileExists} from '../lib/utils/file';
import {finishOnboarding, setRecoveryMode} from './onboarding';
import {subscribeTransactions} from './transaction';
import {pollInfo} from './info';
import {pollTicker} from './ticker';
import {LndMobileEventEmitter} from '../lib/utils/event-listener';
import {lnrpc} from '../lib/lightning/proto/lightning';
import {createConfig} from '../lib/utils/config';
import {pollBalance} from './balance';

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
    // start LND
    await Lnd.startLnd(false, '--nolisten');
    dispatch(lndState(true));
    // TODO: lockup wallet init/unlock until lnd is alive!
  } catch (err) {
    console.error('CANT start LND');
    console.error(err);
    // TODO: handle this
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await NativeModules.LndMobile.stopLnd();
    dispatch(lndState(false));
  } catch (err) {
    console.error('CANT stop LND');
    console.error(err);
    // TODO: handle this
  }
};

export const initWallet = (): AppThunk => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding!;

  const password: string = uuidv4();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();

    await LndWallet.initWallet(
      seed,
      password,
      beingRecovered === true ? 3000 : 0,
    );
    await Lnd.subscribeState();

    LndMobileEventEmitter.addListener('SubscribeState', async event => {
      try {
        const {state} = Lnd.decodeState(event.data);
        if (state === lnrpc.WalletState.RPC_ACTIVE) {
          // dispatch pollers
          dispatch(pollInfo());
          dispatch(subscribeTransactions());
          dispatch(pollTicker());
          dispatch(finishOnboarding());
          // dispatch(backupChannels());
          return;
        }
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export const unlockWallet = (): AppThunk => async dispatch => {
  return new Promise(async resolve => {
    const password = await getItem(PASS);

    try {
      if (password !== null) {
        await LndWallet.unlockWallet(password);
      } else {
        throw new Error('wallet password is null');
      }

      LndMobileEventEmitter.addListener('SubscribeState', async event => {
        try {
          const {state} = Lnd.decodeState(event.data);

          if (state === lnrpc.WalletState.RPC_ACTIVE) {
            // dispatch pollers
            dispatch(pollInfo());
            dispatch(subscribeTransactions());
            dispatch(pollTicker());
            dispatch(pollBalance());

            resolve();
          }
        } catch (error) {
          const dbPath = `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/mainnet/wallet.db`;

          if ((await fileExists(dbPath)) === false) {
            // if no wallet db exists, user has likely uninstalled the app previously
            // in this case, seed exists in keychain. initialise wallet from seed
            // enabling recovery mode to scan for addresses
            dispatch(setRecoveryMode(true));
            dispatch(initWallet());
            dispatch(setRecoveryMode(false));

            // TODO: addtional handling here required
            // TODO: also need to check if seed exist prior to attempting recovery

            resolve();
          } else {
            throw new Error(String(error));
          }
        }
      });

      await Lnd.subscribeState();
    } catch (error: unknown) {
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
