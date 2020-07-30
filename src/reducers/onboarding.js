import shajs from 'sha.js';

import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {
  onboarding: false,
  isOnboarded: false,
  seed: [],
  uniqueId: '',
  beingRecovered: false,
};

// constants
export const ONBOARDING_STARTED = 'ONBOARDING_STARTED';
export const ONBOARDING_FINISHED = 'ONBOARDING_FINISHED';
export const GET_SEED = 'GET_SEED';
export const RECOVER_SEED = 'RECOVER_SEED';

// actions
export const startOnboarding = () => (dispatch) => {
  dispatch({
    type: ONBOARDING_STARTED,
  });
};

export const finishOnboarding = () => (dispatch, getState) => {
  const {seed} = getState().onboarding;
  const uniqueId = shajs('sha256').update(seed.join('')).digest('hex');

  dispatch({
    type: ONBOARDING_FINISHED,
    uniqueId,
  });
};

export const getSeed = () => async (dispatch) => {
  const response = await LndInstance.sendCommand('GenSeed');
  dispatch({
    type: GET_SEED,
    seed: response.cipherSeedMnemonic,
  });
};

export const recoverSeed = (seed) => (dispatch) => {
  console.log('recover seed');
  dispatch({
    type: RECOVER_SEED,
    seed,
  });
};

// action handlers
const actionHandler = {
  [ONBOARDING_STARTED]: (state) => ({
    ...state,
    onboarding: true,
    isOnboarded: false,
    seed: [],
    beingRecovered: false,
  }),
  [ONBOARDING_FINISHED]: (state, {uniqueId}) => ({
    ...state,
    onboarding: false,
    isOnboarded: true,
    beingRecovered: false,
    uniqueId,
  }),
  [GET_SEED]: (state, {seed}) => ({...state, seed}),
  [RECOVER_SEED]: (state, {seed}) => ({...state, seed, beingRecovered: true}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
