import Lightning from '../lib/lightning/lightning';
import { toBuffer } from '../lib/utils';
import { finishOnboarding } from './onboarding';
import { getBalance } from './balance';
import { getInfo } from './info';
import { getTransactions } from './transaction';
import { getTicker } from './ticker';

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
    await LndInstance.sendCommand('InitWallet', {
      walletPassword: toBuffer(encodedPassword),
      cipherSeedMnemonic: seed
    });
  } catch (error) {
    console.log(error);
    // if error likely wallet already exists
    // this should only occur on iOS Simulator & Android emulator
    // TODO: remove existing wallet files
    initWallet();
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
    // if error likely no wallet exists
    initWallet();
  }

  // dispatch pollers
  dispatch(getBalance());
  dispatch(getInfo());
  dispatch(getTransactions());
  dispatch(getTicker());

  dispatch({
    type: UNLOCK_WALLET,
    payload: status
  });
  return status;
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
