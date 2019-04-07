import Lightning from '../lib/lightning/lightning';
import { toBuffer } from '../lib/utils';
// TODO: temporarily run lightning instance in onboarding file
const LndInstance = new Lightning();

// initial state
const initialState = {
  onboarding: false,
  isOnboarded: false,
  passcode: '',
  seed: [],
  passcodeSet: false
};

// constants
export const ONBOARDING_STARTED = 'ONBOARDING_STARTED';
export const ONBOARDING_FINISHED = 'ONBOARDING_FINISHED';
export const GET_SEED = 'GET_SEED';
export const ADD_PASSCODE = 'ADD_PASSCODE';
export const REMOVE_PASSCODE = 'REMOVE_PASSCODE';

// actions
export const startOnboarding = () => dispatch => {
  dispatch({
    type: ONBOARDING_STARTED
  });
};

export const finishOnboarding = () => dispatch => {
  dispatch({
    type: ONBOARDING_FINISHED
  });
};

export const addPincode = input => dispatch => {
  dispatch({
    type: ADD_PASSCODE,
    passcode: input
  });
};

export const removePincode = () => dispatch => {
  dispatch({
    type: REMOVE_PASSCODE
  });
};

export const getSeed = () => async dispatch => {
  const response = await LndInstance.sendCommand('GenSeed');
  dispatch({
    type: GET_SEED,
    seed: response.cipherSeedMnemonic
  });
};

export const initWallet = () => async (dispatch, getState) => {
  const { passcode, seed } = getState().onboarding;
  const encodedPassword = `${passcode}_losh11`;
  try {
    await LndInstance.sendCommand('InitWallet', {
      walletPassword: toBuffer(encodedPassword),
      cipherSeedMnemonic: seed,
      recoveryWindow: 0
    });
  } catch (error) {
    // TODO: handle errors
  }
  dispatch(finishOnboarding());
};

// action handlers
const actionHandler = {
  [ONBOARDING_STARTED]: state => ({ ...state, onboarding: true, isOnboarded: false }),
  [ONBOARDING_FINISHED]: state => ({ ...state, onboarding: false, isOnboarded: true }),
  [GET_SEED]: (state, { seed }) => ({ ...state, seed }),
  [ADD_PASSCODE]: (state, { passcode }) => ({ ...state, passcode, passcodeSet: true }),
  [REMOVE_PASSCODE]: state => ({ ...state, passcodeSet: false })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
