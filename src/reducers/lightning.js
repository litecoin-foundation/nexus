import RNFS from 'react-native-fs';

import lnd, {
  ENetworks,
  LndConf,
  ss_lnrpc,
} from '@litecoinfoundation/react-native-lndltc';

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

// inital state
const initialState = {
  lndActive: false,
  lndState: null,
};

// constants
export const START_LND = 'START_LND';
export const STOP_LND = 'STOP_LND';
export const UPDATE_LND_STATE = 'UPDATE_LND_STATE';

// actions
export const startLnd = () => async dispatch => {
  try {
    // subscribe to LND state
    lnd.stateService.subscribeToStateChanges(res => {
      if (res.isOk()) {
        dispatch({
          type: UPDATE_LND_STATE,
          payload: res.value,
        });
      }
    });

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

export const stopLnd = () => async dispatch => {
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

export const initWallet = () => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding;

  const password = await getRandomBytes();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();
    await lnd.walletUnlocker.initWallet(password, seed);
    // TODO: no recovery window!
    // recoveryWindow: beingRecovered === true ? 3000 : 0,

    lnd.stateService.subscribeToStateChanges(res => {
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
    });
  } catch (error) {
    console.log(error);
  }
};

export const unlockWallet = () => async dispatch => {
  return new Promise(async resolve => {
    const password = await getItem(PASS);

    try {
      await lnd.walletUnlocker.unlockWallet(password);

      lnd.stateService.subscribeToStateChanges(res => {
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
      });
    } catch (error) {
      const dbPath = `${RNFS.DocumentDirectoryPath}/data/chain/litecoin/mainnet/wallet.db`;

      if ((await RNFS.exists(dbPath)) === false) {
        // if no wallet db exists, user has likely uninstalled the app previously
        // in this case, seed exists in keychain. initialise wallet from seed
        // enabling recovery mode to scan for addresses
        await dispatch(setRecoveryMode(true));
        await dispatch(initWallet());
        await dispatch(setRecoveryMode(false));
      } else {
        throw new Error(error);
      }
    }
  });
};

// action handlers
const actionHandler = {
  [START_LND]: state => ({...state, lndActive: true}),
  [STOP_LND]: state => ({...state, lndActive: false}),
  [UPDATE_LND_STATE]: (state, {payload}) => ({...state, lndState: payload}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
