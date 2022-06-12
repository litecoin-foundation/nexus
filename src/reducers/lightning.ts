import lnd, {
  ENetworks,
  LndConf,
  ss_lnrpc,
} from '@litecoinfoundation/react-native-lndltc';
import {AnyAction} from '@reduxjs/toolkit';
import RNFS from 'react-native-fs';

import {ReduxType, AppThunk, IActionHandler} from './types';
import {getRandomBytes} from '../lib/utils/random';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB} from '../lib/utils/file';

import {finishOnboarding, setRecoveryMode} from './onboarding';
import {subscribeTransactions, subscribeInvoices} from './transaction';
import {pollInfo} from './info';
import {pollTicker} from './ticker';
import {backupChannels} from './channels';

const PASS = 'PASSWORD';
const lndConf = new LndConf(ENetworks.mainnet);

// types
interface ILightningState {
  lndActive: boolean;
  lndState: string | null;
}

// initial state
const initialState: ILightningState = {
  lndActive: false,
  lndState: null,
};

// constants
export const START_LND: ReduxType = 'START_LND';
export const STOP_LND: ReduxType = 'STOP_LND';

// actions
export const startLnd = (): AppThunk => async dispatch => {
  try {
    // start LND
    await lnd.start(lndConf);
    dispatch({
      type: START_LND,
    });
  } catch (err) {
    console.log('CANT start LND');
    // TODO: handle this
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await lnd.stop();
    dispatch({
      type: STOP_LND,
    });
  } catch (err) {
    console.log('CANT stop LND');
    // TODO: handle this
  }
};

export const initWallet = (): AppThunk => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding;

  const password = await getRandomBytes();
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
    console.log(error);
  }
};

export const unlockWallet = (): AppThunk => async dispatch => {
  return new Promise(async resolve => {
    const password = await getItem(PASS);

    try {
      if (password !== null) {
        await lnd.walletUnlocker.unlockWallet(password);
      }

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

              resolve();
            }
          }
        },
        () => console.log('LND: onDone'),
      );
    } catch (error: unknown) {
      const dbPath = `${RNFS.DocumentDirectoryPath}/data/chain/litecoin/mainnet/wallet.db`;

      if ((await RNFS.exists(dbPath)) === false) {
        // if no wallet db exists, user has likely uninstalled the app previously
        // in this case, seed exists in keychain. initialise wallet from seed
        // enabling recovery mode to scan for addresses
        await dispatch(setRecoveryMode(true));
        await dispatch(initWallet());
        await dispatch(setRecoveryMode(false));
      } else {
        throw new Error(String(error));
      }
    }
  });
};

// action handlers
const actionHandler: IActionHandler = {
  [START_LND]: state => ({...state, lndActive: true}),
  [STOP_LND]: state => ({...state, lndActive: false}),
};

// reducer
export default function (state = initialState, action: AnyAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
