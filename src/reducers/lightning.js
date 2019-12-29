import RNFS from 'react-native-fs';

import Lightning from '../lib/lightning/lightning';

import {toBuffer} from '../lib/utils';
import {getRandomBytes} from '../lib/utils/random';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB} from '../lib/utils/file';

import {finishOnboarding} from './onboarding';
import {pollBalance} from './balance';
import {pollInfo} from './info';
import {pollTransactions} from './transaction';
import {pollTicker} from './ticker';
import {backupChannels} from './channels';

const LndInstance = new Lightning();
const PASS = 'PASSWORD';

// inital state
const initialState = {
  lndActive: false,
};

// constants
export const START_LND = 'START_LND';
export const STOP_LND = 'STOP_LND';

// actions
export const startLnd = () => async dispatch => {
  try {
    await LndInstance.init();
    dispatch({
      type: START_LND,
    });
  } catch (err) {
    console.log(err);
    console.log('CANT start LND');
    // TODO: handle this
  }
};

export const stopLnd = () => async dispatch => {
  try {
    await LndInstance.close();
    dispatch({
      type: STOP_LND,
    });
  } catch (err) {
    console.log('CANT stop LND');
    // TODO: handle this
  }
};

export const initWallet = () => async (dispatch, getState) => {
  const {seed} = getState().onboarding;

  const password = await getRandomBytes();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();
    await LndInstance.sendCommand('InitWallet', {
      walletPassword: toBuffer(password),
      cipherSeedMnemonic: seed,
      recoveryWindow: 2500, // TODO: should be 0 if new Wallet
    });
    // dispatch pollers
    dispatch(pollBalance());
    dispatch(pollInfo());
    dispatch(pollTransactions());
    dispatch(pollTicker());
    dispatch(backupChannels());
  } catch (error) {
    console.log(error);
  }
  dispatch(finishOnboarding());
};

export const unlockWallet = () => async dispatch => {
  const password = await getItem(PASS);

  try {
    await LndInstance.sendCommand('UnlockWallet', {
      walletPassword: toBuffer(password),
    });
  } catch (error) {
    const dbPath = `${RNFS.DocumentDirectoryPath}/data/chain/litecoin/mainnet/wallet.db`;

    if ((await RNFS.exists(dbPath)) === false) {
      dispatch(initWallet());
    }
  }

  // dispatch pollers
  dispatch(pollBalance());
  dispatch(pollInfo());
  dispatch(pollTransactions());
  dispatch(pollTicker());
  dispatch(backupChannels());
};

// action handlers
const actionHandler = {
  [START_LND]: state => ({...state, lndActive: true}),
  [STOP_LND]: state => ({...state, lndActive: false}),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
