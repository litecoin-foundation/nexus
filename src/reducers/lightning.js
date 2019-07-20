import RNFS from 'react-native-fs';

import Lightning from '../lib/lightning/lightning';
import { toBuffer } from '../lib/utils';
import { finishOnboarding } from './onboarding';
import { getBalance } from './balance';
import { getInfo } from './info';
import { getTransactions } from './transaction';
import { getTicker } from './ticker';
import { backupChannels } from './channels';

const LndInstance = new Lightning();

// inital state
const initialState = {
  lndActive: false,
  walletUnlocked: false
};

// constants
export const START_LND = 'START_LND';
export const STOP_LND = 'STOP_LND';
export const UNLOCK_WALLET = 'UNLOCK_WALLET';

// actions
export const startLnd = () => async dispatch => {
  try {
    await LndInstance.init();
    dispatch({
      type: START_LND
    });
  } catch (err) {
    console.log('CANT start LND');
    // TODO: handle this
  }
};

export const stopLnd = () => async dispatch => {
  try {
    await LndInstance.close();
    dispatch({
      type: STOP_LND
    });
  } catch (err) {
    console.log('CANT stop LND');
    // TODO: handle this
  }
};

export const initWallet = () => async (dispatch, getState) => {
  const { passcode, seed } = getState().onboarding;
  const encodedPassword = `${passcode}_losh11`;
  try {
    await deleteWalletDB();
    await LndInstance.sendCommand('InitWallet', {
      walletPassword: toBuffer(encodedPassword),
      cipherSeedMnemonic: seed,
      recoveryWindow: 1000 // TODO: should be 0 if new Wallet
    });
    // dispatch pollers
    dispatch(getBalance());
    dispatch(getInfo());
    dispatch(getTransactions());
    dispatch(getTicker());
    dispatch(backupChannels());
  } catch (error) {
    console.log(error);
  }
  dispatch(finishOnboarding());
};

export const unlockWallet = input => async (dispatch, getState) => {
  const { passcode } = getState().onboarding;
  const status = input === passcode;
  const encodedPassword = `${input}_losh11`;
  try {
    await LndInstance.sendCommand('UnlockWallet', {
      walletPassword: toBuffer(encodedPassword)
    });
  } catch (error) {
    const dbPath = `${RNFS.DocumentDirectoryPath}/data/chain/litecoin/mainnet/wallet.db`;
    if (!RNFS.exists(dbPath)) {
      dispatch(initWallet());
    }
  }

  // dispatch pollers
  dispatch(getBalance());
  dispatch(getInfo());
  dispatch(getTransactions());
  dispatch(getTicker());
  dispatch(backupChannels());

  dispatch({
    type: UNLOCK_WALLET,
    payload: status
  });
};

export const deleteWalletDB = async () => {
  const dbPath = `${RNFS.DocumentDirectoryPath}/data/chain/litecoin/mainnet/wallet.db`;
  try {
    await RNFS.unlink(dbPath);
  } catch (error) {
    // if initial install, then no wallet db will exist
    console.log('no wallet db exists');
  }
};

// action handlers
const actionHandler = {
  [START_LND]: state => ({ ...state, lndActive: true }),
  [STOP_LND]: state => ({ ...state, lndActive: false }),
  [UNLOCK_WALLET]: (state, { payload }) => ({ ...state, walletUnlocked: payload })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
