import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import shajs from 'sha.js';

import * as Lnd from '../lib/lightning/wallet';

// types
interface IOnboardingState {
  onboarding: boolean;
  isOnboarded: boolean;
  generatedSeed: string[];
  seed: string[];
  uniqueId: string;
  beingRecovered: boolean;
  task: undefined | 'downloading' | 'unzipping' | 'complete' | 'failed';
  downloadProgress?: number;
  unzipProgress?: number;
}

type neutrinoCacheState = {
  task: undefined | 'downloading' | 'unzipping' | 'complete' | 'failed';
  downloadProgress?: number;
  unzipProgress?: number;
};

// initial state
const initialState = {
  onboarding: false,
  isOnboarded: false,
  generatedSeed: [],
  seed: [],
  uniqueId: '',
  beingRecovered: false,
  task: undefined,
  downloadProgress: 0,
  unzipProgress: 0,
} as IOnboardingState;

// actions
export const startOnboarding = createAction('onboarding/startOnboarding');
const finishOnboardingAction = createAction<string>(
  'onboarding/finishOnboardingAction',
);
const genSeedAction = createAction<string[]>('onboarding/genSeedAction');
const setSeedAction = createAction<string[]>('onboarding/setSeedAction');
const setSeedRecoveryAction = createAction<string[]>(
  'onboarding/setSeedRecoveryAction',
);
export const setRecoveryMode = createAction<boolean>(
  'onboarding/setRecoveryMode',
);
// const getNeutrinoCacheAction = createAction<neutrinoCacheState>(
//   'onboarding/getNeutrinoCacheAction',
// );

// functions
export const finishOnboarding = (): AppThunk => (dispatch, getState) => {
  const {seed} = getState().onboarding!;
  const uniqueId: string = shajs('sha256').update(seed.join('')).digest('hex');

  dispatch(finishOnboardingAction(uniqueId));
};

// generates a seed on initial startup
// not necessarily used if wallet is recovered
export const genSeed = (): AppThunk => async dispatch => {
  try {
    const seed = await (await Lnd.genSeed(undefined)).cipherSeedMnemonic;
    dispatch(genSeedAction(seed));
  } catch (error) {
    console.error(error);
  }
};

// sets users wallet seed
export const setSeed = (): AppThunk => (dispatch, getState) => {
  const {generatedSeed, beingRecovered} = getState().onboarding!;
  // if wallet is being recovered, there is not generated seed to set!
  if (beingRecovered) {
    return;
  }
  dispatch(setSeedAction(generatedSeed));
};

export const setSeedRecovery =
  (seedPhrase: string[]): AppThunk =>
  dispatch => {
    dispatch(setSeedRecoveryAction(seedPhrase));
  };

// export const getNeutrinoCache = (): AppThunk => async dispatch => {
//   lndCache.addStateListener((state: ICachedNeutrinoDBDownloadState) => {
//     const {task, downloadProgress, unzipProgress} = state;
//     dispatch(
//       getNeutrinoCacheAction({
//         task,
//         downloadProgress,
//         unzipProgress,
//       }),
//     );
//   });
//   await lndCache.downloadCache(ENetworks.mainnet);
// };

// slicer
export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    startOnboarding: state => ({
      ...state,
      onboarding: true,
      isOnboarded: false,
      seed: [],
      beingRecovered: false,
    }),
    finishOnboardingAction: (state, action: PayloadAction<string>) => ({
      ...state,
      onboarding: false,
      isOnboarded: true,
      beingRecovered: false,
      uniqueId: action.payload,
    }),
    genSeedAction: (state, action: PayloadAction<string[]>) => ({
      ...state,
      generatedSeed: action.payload,
    }),
    setSeedAction: (state, action: PayloadAction<string[]>) => ({
      ...state,
      seed: action.payload,
    }),
    setSeedRecoveryAction: (state, action: PayloadAction<string[]>) => ({
      ...state,
      seed: action.payload,
      beingRecovered: true,
    }),
    setRecoveryMode: (state, action: PayloadAction<boolean>) => ({
      ...state,
      beingRecovered: action.payload,
    }),
    getNeutrinoCacheAction: (
      state,
      action: PayloadAction<neutrinoCacheState>,
    ) => ({
      ...state,
      task: action.payload.task,
      downloadProgress: action.payload.downloadProgress,
      unzipProgress: action.payload.unzipProgress,
    }),
  },
});

export default onboardingSlice.reducer;
