import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';
import {unzip, subscribe} from 'react-native-zip-archive';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Crypto from 'react-native-quick-crypto';

import {AppThunk} from './types';
import {fileExists} from '../lib/utils/file';
import {showError} from './errors';
import {generateMnemonic} from '../lib/utils/aezeed';
import {setItem} from '../lib/utils/keychain';

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
const updateNeutrinoCacheDownloadProgress = createAction<number>(
  'onboarding/updateNeutrinoCacheDownloadProgress',
);
const updateNeutrinoCacheUnzipProgress = createAction<number>(
  'onboarding/updateNeutrinoCacheUnzipProgress',
);
const getNeutrinoCacheFailedAction = createAction(
  'onboarding/getNeutrinoCacheFailedAction',
);
const getNeutrinoCacheSuccessAction = createAction(
  'onboarding/getNeutrinoCacheSuccessAction',
);

// functions
export const finishOnboarding = (): AppThunk => (dispatch, getState) => {
  const {seed} = getState().onboarding!;
  console.log(seed.join(''));
  const uniqueId: string = Crypto.createHash('sha256')
    .update(seed.join(''))
    .digest('hex');

  dispatch(finishOnboardingAction(uniqueId));
};

// generates a seed on initial startup
// not necessarily used if wallet is recovered
export const genSeed = (): AppThunk => async dispatch => {
  try {
    const seed = await generateMnemonic();
    console.log(seed.join(''));
    await setItem('SEEDPHRASE', seed.join(''));
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

export const getNeutrinoCache = (): AppThunk => async (dispatch, getState) => {
  const {task} = getState().onboarding;
  // download neutrino cache from server
  if (task === 'complete') {
    // neutrino cache already fetched & extracted
    // user has likely failed to finish onboarding
    console.log('neutrino cache ready!');
    return;
  } else {
    // neutrino cache archive doesn't exist
    // download, then extract
    console.log('fetching mainnet.zip');
    ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: 'zip',
      path: `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet.zip`,
      IOSBackgroundTask: true,
    })
      .fetch('GET', 'https://static-mobile.litecoin.com/mainnet.zip')
      .progress((received, total) => {
        dispatch(
          updateNeutrinoCacheDownloadProgress(Number(received) / Number(total)),
        );
      })
      .then(async response => {
        const {status} = response.info();
        if (status === 200) {
          // successful download
          dispatch(extractNeutrinoCache());
        } else {
          dispatch(getNeutrinoCacheFailedAction());
        }
      })
      .catch(error => {
        console.error(error);
        dispatch(showError(String(error)));
        dispatch(getNeutrinoCacheFailedAction());
        return;
      });
  }
};

const extractNeutrinoCache = (): AppThunk => async dispatch => {
  try {
    console.log('starting extraction!');
    // delete any preexisting filter files if any exists
    const blkHeaderPath = `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/mainnet/block_headers.bin`;
    const neutrinodbPath = `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/mainnet/neutrino.db`;
    const filterHeaderPath = `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/mainnet/reg_filter_headers.bin`;
    if (await fileExists(blkHeaderPath)) {
      await FileSystem.deleteAsync(blkHeaderPath);
    }
    if (await fileExists(neutrinodbPath)) {
      await FileSystem.deleteAsync(neutrinodbPath);
    }
    if (await fileExists(filterHeaderPath)) {
      await FileSystem.deleteAsync(filterHeaderPath);
    }
    // extract cache
    subscribe(({progress}) => {
      dispatch(updateNeutrinoCacheUnzipProgress(Math.floor(progress * 100)));
    });
    await unzip(
      `${FileSystem.documentDirectory}/mainnet.zip`,
      `${FileSystem.documentDirectory}/lndltc/data/chain/litecoin/`,
    );
    // clean up
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}/mainnet.zip`);
    ReactNativeBlobUtil.fs.unlink(
      `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet.zip`,
    );
    dispatch(getNeutrinoCacheSuccessAction());
  } catch (error) {
    console.error(error);
    dispatch(getNeutrinoCacheFailedAction());
  }
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
    updateNeutrinoCacheDownloadProgress: (
      state,
      action: PayloadAction<number>,
    ) => ({
      ...state,
      task: 'downloading',
      downloadProgress: action.payload,
    }),
    getNeutrinoCacheFailedAction: state => ({
      ...state,
      task: 'failed',
      downloadProgress: 0,
      unzipProgress: 0,
    }),
    updateNeutrinoCacheUnzipProgress: (
      state,
      action: PayloadAction<number>,
    ) => ({
      ...state,
      task: 'unzipping',
      downloadProgress: 0,
      unzipProgress: action.payload,
    }),
    getNeutrinoCacheSuccessAction: state => ({
      ...state,
      task: 'complete',
      unzipProgress: 0,
    }),
  },
});

export default onboardingSlice.reducer;
