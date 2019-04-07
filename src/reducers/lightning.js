import Lightning from '../lib/lightning/lightning';
import { toBuffer } from '../lib/utils';

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

export const unlockWallet = input => async (dispatch, getState) => {
  const { passcode } = getState().onboarding;
  const status = input === passcode;
  const encodedPassword = `${input}_losh11`;
  try {
    await LndInstance.sendCommand('UnlockWallet', {
      walletPassword: toBuffer(encodedPassword),
      recoveryWindow: 0
    });
  } catch (error) {
    // TODO: handle this
    alert(error);
  }
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
  [UNLOCK_WALLET]: (state, payload) => ({ ...state, walletUnlocked: payload })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
