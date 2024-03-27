import lnd, {
  ENetworks,
  LndConf,
  ss_lnrpc,
} from '@litecoinfoundation/react-native-lndltc';
import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import RNFS from 'react-native-fs';

import {AppThunk} from './types';
import {v4 as uuidv4} from 'uuid';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB} from '../lib/utils/file';

import {finishOnboarding, setRecoveryMode} from './onboarding';
import {subscribeTransactions, subscribeInvoices} from './transaction';
import {pollInfo} from './info';
import {pollTicker} from './ticker';
import {backupChannels} from './channels';

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
    const lndConf = new LndConf(ENetworks.mainnet);

    // start LND
    await lnd.start(lndConf);
    dispatch(lndState(true));
  } catch (err) {
    console.error('CANT start LND');
    // TODO: handle this
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await lnd.stop();
    dispatch(lndState(false));
  } catch (err) {
    console.error('CANT stop LND');
    // TODO: handle this
  }
};

export const initWallet = (): AppThunk => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding;

  const password: string = uuidv4();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();

    await lnd.walletUnlocker.initWallet(
      password,
      seed,
      undefined,
      beingRecovered === true ? 3000 : 0,
    );

    lnd.stateService.subscribeToStateChanges(
      res => {
        if (res.isOk()) {
          if (res.value === ss_lnrpc.WalletState.RPC_ACTIVE) {
            // dispatch pollers
            dispatch(pollInfo());
            dispatch(subscribeTransactions());
            dispatch(subscribeInvoices());
            dispatch(pollTicker());
            dispatch(backupChannels());
            dispatch(finishOnboarding());
            return;
          }
        }
      },
      () => console.log('LND: onDone'),
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
        const res = await lnd.walletUnlocker.unlockWallet(password);

        if (res.isErr()) {
          throw new Error(String(res.error));
        }
      } else {
        throw new Error('wallet password is null');
      }

      lnd.stateService.subscribeToStateChanges(
        res => {
          if (res.isErr()) {
            throw new Error(String(res.error));
          }
          if (res.isOk()) {
            if (res.value === ss_lnrpc.WalletState.RPC_ACTIVE) {
              // dispatch pollers
              dispatch(pollInfo());
              dispatch(subscribeTransactions());
              dispatch(subscribeInvoices());
              dispatch(pollTicker());
              dispatch(backupChannels());

              resolve();
            }
          }
        },
        () => console.log('LND: onDone'),
      );
    } catch (error: unknown) {
      const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;

      if ((await RNFS.exists(dbPath)) === false) {
        // if no wallet db exists, user has likely uninstalled the app previously
        // in this case, seed exists in keychain. initialise wallet from seed
        // enabling recovery mode to scan for addresses
        await dispatch(setRecoveryMode(true));
        await dispatch(initWallet());
        await dispatch(setRecoveryMode(false));

        // TODO: addtional handling here required
        // TODO: also need to check if seed exist prior to attempting recovery

        resolve();
      } else {
        throw new Error(String(error));
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
  },
});

export default lightningSlice.reducer;
