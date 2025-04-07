import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import * as FileSystem from 'expo-file-system';
import {unzip, subscribe} from 'react-native-zip-archive';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Crypto from 'react-native-quick-crypto';
import * as RNFS from 'react-native-fs';
import {Platform} from 'react-native';

import {AppThunk} from './types';
import {fileExists} from '../lib/utils/file';
import {showError} from './errors';
import {setDeviceNotificationToken} from './settings';
import {generateMnemonic} from '../lib/utils/aezeed';
import {setItem} from '../lib/utils/keychain';
import {sleep} from '../lib/utils/poll';

// types
interface IOnboardingState {
  onboarding: boolean;
  isOnboarded: boolean;
  generatedSeed: string[];
  seed: string[];
  seedVerified: boolean;
  uniqueId: string;
  supportId: string;
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
  seedVerified: false,
  uniqueId: '',
  supportId: '',
  beingRecovered: false,
  task: undefined,
  downloadProgress: 0,
  unzipProgress: 0,
  lastLoadedCachePart: 0,
} as IOnboardingState;

const apiAuthUrl = 'https://api.nexuswallet.com/auth';

// actions
export const startOnboarding = createAction('onboarding/startOnboarding');
const finishOnboardingAction = createAction<string>(
  'onboarding/finishOnboardingAction',
);
const genSeedAction = createAction<string[]>('onboarding/genSeedAction');
const setSeedAction = createAction<string[]>('onboarding/setSeedAction');
export const setSeedVerified = createAction<boolean>(
  'onboarding/setSeedVerified',
);
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
const setSupportIdAction = createAction<string>(
  'onboarding/setSupportIdAction',
);

// functions
export const loginToNexusApi =
  (deviceToken: string, isIOS: boolean): AppThunk =>
  async (dispatch, getState) => {
    const {uniqueId, isOnboarded} = getState().onboarding;
    const {deviceNotificationToken} = getState().settings;
    if (isOnboarded !== true && !uniqueId && !deviceToken) {
      return;
    }
    try {
      if (!deviceNotificationToken) {
        dispatch(setDeviceNotificationToken(deviceToken));
      }

      const req = await fetch(`${apiAuthUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appAuthKey: 'PCUgU3Vcuu4LNRdFPueKLEfsdbcSEgYFUSec4EXx3Ws79f6ckx',
          userAppUniqueId: uniqueId,
          deviceToken: deviceToken,
          isIOS,
        }),
      });

      if (!req.ok) {
        return;
      }

      const req2 = await fetch('https://api.nexuswallet.com/api/support/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: uniqueId,
        }),
      });

      if (!req2.ok) {
        const error = await req2.json();
        throw new Error(String(error));
      }

      const response = await req2.json();
      const {hash} = response;
      dispatch(setSupportIdAction(hash));
    } catch (error) {
      console.error(error);
    }
  };

export const finishOnboarding = (): AppThunk => (dispatch, getState) => {
  const {seed} = getState().onboarding!;
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

const cacheParts = [
  'cache.z00',
  'cache.z01',
  'cache.z02',
  'cache.z03',
  'cache.z04',
  'cache.z05',
  'cache.z06',
  'cache.z07',
  'cache.z08',
  'cache.z09',
];

export const getNeutrinoCache = (): AppThunk => async (dispatch, getState) => {
  const {task, lastLoadedCachePart} = getState().onboarding;

  if (task === 'complete') {
    console.log('neutrino cache ready!');
    return;
  } else {
    // Check for free space
    // 1GB in bytes
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    if (freeSpace < 1000 * Math.pow(2, 20)) {
      // TODO: handle presync failure better
      throw new Error('Device requires at least 1GB of free space to presync!');
    }

    console.log('fetching mainnet.zip in multipart mode!');

    const partNum = 10;
    const nextPart = lastLoadedCachePart + 1;

    ReactNativeBlobUtil.config({
      fileCache: true,
      path: `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${
        cacheParts[nextPart - 1]
      }`,
      IOSBackgroundTask: true,
    })
      .fetch(
        'GET',
        `https://static.nexuswallet.com/cache/${cacheParts[nextPart - 1]}`,
      )
      .progress((received, total) => {
        dispatch(
          updateNeutrinoCacheDownloadProgress(
            ((Number(total) / partNum) * (nextPart - 1)) / Number(total) +
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
            const outputFilePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet.zip`;
            dispatch(combineZipPartsAndExtract(cacheParts, outputFilePath));
          } else {
            // download next part
            dispatch(setLastLoadedCachePart(nextPart));
            // recursive call, syncronous dispatch queue is crucial here
            // as we save index of a finished part and start loading the next one
            dispatch(getNeutrinoCache());
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
      await RNFS.writeFile(outputFilePath, '', 'utf8');

      for await (const part of fileParts) {
        const partPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${part}`;

        // Check if the part exists
        if (!(await RNFS.exists(partPath))) {
          throw new Error(`File part ${part} not found`);
        }

        if (Platform.OS === 'android') {
          const size = (await RNFS.stat(partPath)).size;
          const chunkSize = 1024 * 1024;

          // Read part and append to the output file in chunks
          for (let i = 0; i < size; i += chunkSize) {
            const data = await RNFS.read(partPath, chunkSize, i, 'base64');
            await RNFS.appendFile(outputFilePath, data, 'base64');
          }
        } else if (Platform.OS === 'ios') {
          // Read part and append to the output file
          const partData = await RNFS.readFile(partPath, 'base64');
          await RNFS.appendFile(outputFilePath, partData, 'base64');
        }
      }

      // TODO: sometimes blob-util will call .then() before a downloaded file is ready
      // so we sleep for a few seconds to make sure we're ready.
      // Look into fixing permanently!
      await sleep(2000);

      // delete cached parts
      for (const part of cacheParts) {
        RNFS.unlink(`${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${part}`);
      }

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
    await RNFS.unlink(`${ReactNativeBlobUtil.fs.dirs.DocumentDir}/mainnet.zip`);
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
    setSeedVerified: (state, action: PayloadAction<boolean>) => ({
      ...state,
      seedVerified: action.payload,
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
      unzipProgress: 0,
    }),
    updateNeutrinoCacheUnzipProgress: (
      state,
      action: PayloadAction<number>,
    ) => ({
      ...state,
      task: 'unzipping',
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
    setSupportIdAction: (state, action: PayloadAction<string>) => ({
      ...state,
      supportId: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default onboardingSlice.reducer;
