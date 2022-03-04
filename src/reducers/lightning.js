import RNFS from 'react-native-fs';

import Lightning from '../lib/lightning/lightning';

import {toBuffer} from '../lib/utils';
import {getRandomBytes} from '../lib/utils/random';
import {setItem, getItem} from '../lib/utils/keychain';
import {deleteWalletDB} from '../lib/utils/file';

import {finishOnboarding, setRecoveryMode} from './onboarding';
import {pollBalance} from './balance';
import {pollInfo} from './info';
import {subscribeTransactions, subscribeInvoices} from './transaction';
import {pollTicker} from './ticker';
import {backupChannels, connectToPeer} from './channels';

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
  const {seed, beingRecovered} = getState().onboarding;

  const password = await getRandomBytes();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();
    await LndInstance.sendCommand('InitWallet', {
      walletPassword: toBuffer(password),
      cipherSeedMnemonic: seed,
      recoveryWindow: beingRecovered === true ? 3000 : 0,
    });

    //TODO: replace timeout with rpcCallback from Lnd
    await new Promise(r => setTimeout(r, 5000));

    // dispatch pollers
    dispatch(pollBalance());
    dispatch(pollInfo());
    dispatch(subscribeTransactions());
    dispatch(subscribeInvoices());
    dispatch(pollTicker());
    dispatch(backupChannels());

    // currently no litecoin lightning dns seed exists for bootstrapping
    // in the meanwhile to sync to graph we must manually connect to a peer
    // in this case BOLTZ exchange's peer
    dispatch(
      connectToPeer(
        '02a4cb9d9c40ab508be3641a3b42be249e7cacfc7fea600485f9e37e46382aaa49@104.196.200.39:10735',
      ),
    );
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
      // if no wallet db exists, user has likely uninstalled the app previously
      // in this case, seed exists in keychain. initialise wallet from seed
      // enabling recovery mode to scan for addresses
      await dispatch(setRecoveryMode(true));
      await dispatch(initWallet());
      await dispatch(setRecoveryMode(false));
    }
  }

  //TODO: replace timeout with rpcCallback from Lnd
  await new Promise(r => setTimeout(r, 4500));

  // dispatch pollers
  dispatch(pollBalance());
  dispatch(pollInfo());
  dispatch(subscribeTransactions());
  dispatch(pollTicker());
  dispatch(backupChannels());
};

// action handlers
const actionHandler = {
  [START_LND]: state => ({...state, lndActive: true}),
  [STOP_LND]: state => ({...state, lndActive: false}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
