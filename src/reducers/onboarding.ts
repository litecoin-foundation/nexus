import {AnyAction} from '@reduxjs/toolkit';
import {ReduxType, AppThunk, IActionHandler} from './types';
import lnd, {
  ENetworks,
  ICachedNeutrinoDBDownloadState,
} from '@litecoinfoundation/react-native-lndltc';
import lndCache from '@litecoinfoundation/react-native-lndltc/dist/utils/neutrino-cache';
import shajs from 'sha.js';

// types
interface IOnboardingState {
  onboarding: boolean;
  isOnboarded: boolean;
  seed: string[];
  uniqueId: string;
  beingRecovered: boolean;
  task: undefined | 'downloading' | 'unzipping' | 'complete' | 'failed';
  downloadProgress?: number;
  unzipProgress?: number;
}

// initial state
const initialState: IOnboardingState = {
  onboarding: false,
  isOnboarded: false,
  seed: [],
  uniqueId: '',
  beingRecovered: false,
  task: undefined,
  downloadProgress: 0,
  unzipProgress: 0,
};

// constants
export const ONBOARDING_STARTED: ReduxType = 'ONBOARDING_STARTED';
export const ONBOARDING_FINISHED: ReduxType = 'ONBOARDING_FINISHED';
export const GET_SEED: ReduxType = 'GET_SEED';
export const RECOVER_SEED: ReduxType = 'RECOVER_SEED';
export const SET_RECOVERY_MODE: ReduxType = 'SET_RECOVERY_MODE';
export const GET_NEUTRINO_CACHE: ReduxType = 'GET_NEUTRINO_CACHE';

// actions
export const startOnboarding = (): AppThunk => dispatch => {
  dispatch({
    type: ONBOARDING_STARTED,
  });
};

export const finishOnboarding = (): AppThunk => (dispatch, getState) => {
  const {seed} = getState().onboarding;
  const uniqueId = shajs('sha256').update(seed.join('')).digest('hex');

  dispatch({
    type: ONBOARDING_FINISHED,
    uniqueId,
  });
};

export const getSeed = (): AppThunk => async dispatch => {
  const rpc = await lnd.walletUnlocker.genSeed();
  if (rpc.isErr()) {
    console.error(rpc.error);
  }

  if (rpc.isOk()) {
    dispatch({
      type: GET_SEED,
      seed: rpc.value,
    });
  }
};

export const recoverSeed =
  (seed: string[]): AppThunk =>
  dispatch => {
    dispatch({
      type: RECOVER_SEED,
      seed,
    });
  };

export const setRecoveryMode =
  (bool: boolean): AppThunk =>
  dispatch => {
    dispatch({
      type: SET_RECOVERY_MODE,
      bool,
    });
  };

export const getNeutrinoCache = (): AppThunk => async dispatch => {
  lndCache.addStateListener((state: ICachedNeutrinoDBDownloadState) => {
    const {task, downloadProgress, unzipProgress} = state;
    dispatch({
      type: GET_NEUTRINO_CACHE,
      task,
      downloadProgress,
      unzipProgress,
    });
  });
  await lndCache.downloadCache(ENetworks.mainnet);
};

// action handlers
const actionHandler: IActionHandler = {
  [ONBOARDING_STARTED]: state => ({
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
  [SET_RECOVERY_MODE]: (state, {bool}) => ({...state, beingRecovered: bool}),
  [GET_NEUTRINO_CACHE]: (state, {task, downloadProgress, unzipProgress}) => ({
    ...state,
    task,
    downloadProgress,
    unzipProgress,
  }),
};

// reducer
export default function (state = initialState, action: AnyAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
