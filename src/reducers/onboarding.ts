import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './types';
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

type neutrinoCacheState = {
  task: undefined | 'downloading' | 'unzipping' | 'complete' | 'failed';
  downloadProgress?: number;
  unzipProgress?: number;
};

// initial state
const initialState = {
  onboarding: false,
  isOnboarded: false,
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
const getSeedAction = createAction<string[]>('onboarding/getSeedAction');
export const setRecoveryMode = createAction<boolean>(
  'onboarding/setRecoveryMode',
);
export const recoverSeed = createAction<string[]>('onboarding/recoverSeed');
const getNeutrinoCacheAction = createAction<neutrinoCacheState>(
  'getNeutrinoCacheAction',
);

// actions
export const finishOnboarding = (): AppThunk => (dispatch, getState) => {
  const {seed} = getState().onboarding;
  const uniqueId: string = shajs('sha256').update(seed.join('')).digest('hex');

  dispatch(finishOnboardingAction(uniqueId));
};

export const getSeed = (): AppThunk => async dispatch => {
  const rpc = await lnd.walletUnlocker.genSeed();
  if (rpc.isErr()) {
    console.error(rpc.error);
  }

  if (rpc.isOk()) {
    dispatch(getSeedAction(rpc.value));
  }
};

export const getNeutrinoCache = (): AppThunk => async dispatch => {
  lndCache.addStateListener((state: ICachedNeutrinoDBDownloadState) => {
    const {task, downloadProgress, unzipProgress} = state;
    dispatch(
      getNeutrinoCacheAction({
        task,
        downloadProgress,
        unzipProgress,
      }),
    );
  });
  await lndCache.downloadCache(ENetworks.mainnet);
};

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
    getSeedAction: (state, action: PayloadAction<string[]>) => ({
      ...state,
      seed: action.payload,
    }),
    recoverSeed: (state, action: PayloadAction<string[]>) => ({
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
