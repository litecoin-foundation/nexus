import {createAction, createSlice} from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import {
  getInfo as getLndInfo,
  getRecoveryInfo as getLndRecoveryInfo,
} from 'react-native-turbo-lnd';

import {AppThunk} from './types';
import {poll} from '../lib/utils/poll';
import {RootState} from '../store';

// types
interface IInfo {
  identityPubkey: string;
  alias: string;
  version: string;
  syncedToChain: boolean;
  syncedToGraph: boolean;
  blockHeight: number;
  blockHash: string;
  bestHeaderTimestamp: string;
  uris: string[];
  numPeers: number;
  numActiveChannels: number;
  numPendingChannels: number;
  numInactiveChannels: number;
  isInternetReachable: boolean | null;
  startingSyncTimestamp: string;
  percentSynced: number | undefined;
  recoveryProgress: number;
  recoveryFinished: boolean;
  recoveryMode: boolean;
}

type GetInfoType = Omit<
  IInfo,
  | 'isInternetReachable'
  | 'recoveryProgress'
  | 'recoveryFinished'
  | 'recoveryMode'
>;

interface IGetRecoveryType {
  recoveryProgress: number;
  recoveryFinished: boolean;
  recoveryMode: boolean;
}

// initial state
const initialState = {
  identityPubkey: '',
  alias: '',
  version: '',
  syncedToChain: false,
  syncedToGraph: false,
  blockHeight: 0,
  blockHash: '',
  bestHeaderTimestamp: '',
  uris: [],
  numPeers: 0,
  numActiveChannels: 0,
  numPendingChannels: 0,
  numInactiveChannels: 0,
  isInternetReachable: null,
  startingSyncTimestamp: '0',
  percentSynced: 0,
  recoveryProgress: 0,
  recoveryMode: false,
  recoveryFinished: false,
} as IInfo;

// actions
const getInfoAction = createAction<GetInfoType>('info/getInfoAction');
const getRecoveryInfoAction = createAction<IGetRecoveryType>(
  'info/getRecoveryInfoAction',
);
const checkInternetReachableAction = createAction<boolean | null>(
  'info/checkInternetReachableAction',
);

// functions
const getInfo = (): AppThunk => async (dispatch, getState) => {
  const {lndActive} = getState().lightning;
  if (!lndActive) {
    return;
  }
  try {
    const infoRpc = await getLndInfo({});

    let info = {
      identityPubkey: infoRpc.identityPubkey,
      alias: infoRpc.alias,
      version: infoRpc.version,
      syncedToChain: infoRpc.syncedToChain,
      syncedToGraph: infoRpc.syncedToGraph,
      blockHeight: infoRpc.blockHeight,
      blockHash: infoRpc.blockHash,
      bestHeaderTimestamp: infoRpc.bestHeaderTimestamp.toString(),
      uris: infoRpc.uris,
      numPeers: infoRpc.numPeers,
      numActiveChannels: infoRpc.numActiveChannels,
      numPendingChannels: infoRpc.numPendingChannels,
      numInactiveChannels: infoRpc.numInactiveChannels,
      startingSyncTimestamp: '0',
      percentSynced: 0,
    };

    // TODO: refactor required
    // first get neutrino cache before initwallet
    // then only calculate actual sync progress
    const {startingSyncTimestamp} = getState().info!;

    // calculate % synced
    if (startingSyncTimestamp === undefined) {
      info.startingSyncTimestamp =
        String(info.bestHeaderTimestamp) || String(0);
    }
    const syncPercentage = await calculateSyncProgress(
      String(info.bestHeaderTimestamp),
      startingSyncTimestamp,
    );
    if (syncPercentage < 0.9) {
      info.syncedToChain = false;
    }
    if (!info.syncedToChain) {
      info.percentSynced = await calculateSyncProgress(
        String(info.bestHeaderTimestamp),
        startingSyncTimestamp,
      );
    }

    dispatch(getInfoAction(info));
  } catch (error) {
    console.error(`getInfo error: ${error}`);
  }
};

export const pollInfo = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getInfo()));
};

export const getRecoveryInfo = (): AppThunk => async dispatch => {
  try {
    const response = await getLndRecoveryInfo({});

    dispatch(
      getRecoveryInfoAction({
        recoveryProgress: response.progress,
        recoveryFinished: response.recoveryFinished,
        recoveryMode: response.recoveryMode,
      }),
    );
  } catch (error) {
    console.error(`getRecoveryInfo error: ${error}`);
  }
};

export const checkInternetReachable = (): AppThunk => async dispatch => {
  NetInfo.addEventListener(state => {
    dispatch(checkInternetReachableAction(state.isInternetReachable));
  });
};

const calculateSyncProgress = async (
  bestHeaderTimestamp: string,
  startingSyncTimestamp: IInfo['startingSyncTimestamp'],
) => {
  const currentTimestamp = new Date().getTime() / 1000;
  const progressSoFar = bestHeaderTimestamp
    ? BigInt(bestHeaderTimestamp) - BigInt(startingSyncTimestamp)!
    : 0;
  const totalProgress =
    currentTimestamp - Number(startingSyncTimestamp)! || 0.001;
  const percentSynced = (Number(progressSoFar) * 1.0) / totalProgress;
  return percentSynced;
};

// slice
export const infoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {
    getInfoAction: (state, action) => ({...state, ...action.payload}),
    checkInternetReachableAction: (state, action) => ({
      ...state,
      isInternetReachable: action.payload,
    }),
    getRecoveryInfoAction: (state, action) => ({...state, ...action.payload}),
  },
});

// selectors
export const percentSyncedSelector = (state: RootState) =>
  state.info!.percentSynced;
export const syncStatusSelector = (state: RootState) =>
  state.info!.syncedToChain;

export default infoSlice.reducer;
