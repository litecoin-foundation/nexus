import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';
import {unzip, subscribe} from 'react-native-zip-archive';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Crypto from 'react-native-quick-crypto';
import RNFS from 'react-native-fs';

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
  lastLoadedCachePart: number;
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
  lastLoadedCachePart: 0,
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
const setLastLoadedCachePart = createAction<number>(
  'onboarding/setLastLoadedCachePart',
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

export const getNeutrinoCacheMultipart =
  (): AppThunk => async (dispatch, getState) => {
    const {task, lastLoadedCachePart} = getState().onboarding;

    if (task === 'complete') {
      console.log('neutrino cache ready!');
      return;
    } else {
      // Check for free space
      const fsInfoResult = await RNFS.getFSInfo();
      // 700MB
      if (fsInfoResult.freeSpace < 700 * Math.pow(2, 20)) {
        throw new Error('No space for presync.');
      }

      console.log('multipart fetching mainnet.zip');

      const partNum = 10;
      const nextPart = lastLoadedCachePart + 1;

      ReactNativeBlobUtil.config({
        fileCache: true,
        appendExt: 'zip',
        path: `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet-${nextPart}.zip`,
        IOSBackgroundTask: true,
      })
        .fetch(
          'GET',
          `https://static-mobile.litecoin.com/mainnet-${nextPart}.zip`,
        )
        .progress((received, total) => {
          dispatch(
            updateNeutrinoCacheDownloadProgress(
              Number(received) / Number(total) / partNum,
            ),
          );
        })
        .then(async response => {
          const {status} = response.info();
          if (status === 200) {
            // successful download
            if (nextPart === partNum) {
              // combine and extract
              const cacheParts = [
                'mainnet-1.zip',
                'mainnet-2.zip',
                'mainnet-3.zip',
                'mainnet-4.zip',
                'mainnet-5.zip',
                'mainnet-6.zip',
                'mainnet-7.zip',
                'mainnet-8.zip',
                'mainnet-9.zip',
                'mainnet-10.zip',
              ];
              const outputFilePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet.zip`;
              dispatch(combineZipPartsAndExtract(cacheParts, outputFilePath));
            } else {
              // download next part
              dispatch(setLastLoadedCachePart(nextPart));
              // recursive call, syncronous dispatch queue is crucial here
              // as we save index of a finished part and start loading the next one
              dispatch(getNeutrinoCacheMultipart());
            }
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

const combineZipPartsAndExtract =
  (fileParts: string[], outputFilePath: string): AppThunk =>
  async dispatch => {
    try {
      // Ensure the output file doesn't already exist
      if (await RNFS.exists(outputFilePath)) {
        await RNFS.unlink(outputFilePath);
      }

      // Open output file for appending
      await RNFS.writeFile(outputFilePath, '', 'base64');

      for await (const part of fileParts) {
        const partPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${part}`;

        // Check if the part exists
        if (!(await RNFS.exists(partPath))) {
          throw new Error(`File part ${part} not found`);
        }

        // Read part and append to the output file
        const partData = await RNFS.readFile(partPath, 'base64'); // Read in binary format
        await RNFS.appendFile(outputFilePath, partData, 'base64');
      }

      console.log('All parts combined successfully!');
      dispatch(extractNeutrinoCache());
    } catch (error) {
      console.error('Error combining files:', error);
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
    setLastLoadedCachePart: (state, action: PayloadAction<number>) => ({
      ...state,
      lastLoadedCachePart: action.payload,
    }),
  },
});

export default onboardingSlice.reducer;
