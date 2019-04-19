import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {
  onboarding: false,
  isOnboarded: false,
  passcode: '',
  passcodeSet: false,
  seed: [],
  beingRecovered: false
};

// constants
export const ONBOARDING_STARTED = 'ONBOARDING_STARTED';
export const ONBOARDING_FINISHED = 'ONBOARDING_FINISHED';
export const GET_SEED = 'GET_SEED';
export const RECOVER_SEED = 'RECOVER_SEED';
export const ADD_PASSCODE = 'ADD_PASSCODE';

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

export const getSeed = () => async dispatch => {
  const response = await LndInstance.sendCommand('GenSeed');
  dispatch({
    type: GET_SEED,
    seed: response.cipherSeedMnemonic
  });
};

export const recoverSeed = seed => dispatch => {
  dispatch({
    type: RECOVER_SEED,
    seed
  });
};

// action handlers
const actionHandler = {
  [ONBOARDING_STARTED]: state => ({
    ...state,
    onboarding: true,
    isOnboarded: false,
    passcode: '',
    passcodeSet: false,
    seed: [],
    beingRecovered: false
  }),
  [ONBOARDING_FINISHED]: state => ({
    ...state,
    onboarding: false,
    isOnboarded: true,
    beingRecovered: false
  }),
  [GET_SEED]: (state, { seed }) => ({ ...state, seed }),
  [RECOVER_SEED]: (state, { seed }) => ({ ...state, seed, beingRecovered: true }),
  [ADD_PASSCODE]: (state, { passcode }) => ({ ...state, passcode, passcodeSet: true })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
