import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import NetInfo from '@react-native-community/netinfo';
import {
  getInfo as getLndInfo,
  getRecoveryInfo as getLndRecoveryInfo,
  neutrinoKitStatus,
} from 'react-native-turbo-lndltc';

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
  decimalSynced: number;
  recoveryProgress: number;
  recoveryFinished: boolean;
  recoveryMode: boolean;
  peers: any[];
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
  startingSyncTimestamp: '1317969544',
  decimalSynced: 0,
  recoveryProgress: 0,
  recoveryMode: false,
  recoveryFinished: false,
  peers: [],
} as IInfo;

// actions
const getPeersAction = createAction<any[]>('info/getPeersAction');
const getInfoAction = createAction<GetInfoType>('info/getInfoAction');
const getRecoveryInfoAction = createAction<IGetRecoveryType>(
  'info/getRecoveryInfoAction',
);
const checkInternetReachableAction = createAction<boolean | null>(
  'info/checkInternetReachableAction',
);

// functions
const getPeers = (): AppThunk => async (dispatch, getState) => {
  const {lndActive} = getState().lightning;
  if (!lndActive) {
    dispatch(getPeersAction([]));
    return;
  }
  try {
    const statusRpc = await neutrinoKitStatus({});

    if (statusRpc.peers) {
      dispatch(getPeersAction(statusRpc.peers));
    } else {
      dispatch(getPeersAction([]));
    }
  } catch (error) {
    dispatch(getPeersAction([]));
    console.error(`getPeers error: ${error}`);
  }
};

export const pollPeers = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getPeers()), 10000);
};

const getInfo = (): AppThunk => async (dispatch, getState) => {
  const {lndActive} = getState().lightning;
  if (!lndActive) {
    return;
  }
  try {
    const infoRpc = await getLndInfo({});

    const {peers} = getState().info;

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
      startingSyncTimestamp: '1317969544',
      decimalSynced: 0,
      peers: peers,
    };

    // TODO: refactor required
    // first get neutrino cache before initwallet
    // then only calculate actual sync progress
    const {startingSyncTimestamp} = getState().info;

    // calculate synced in decimal
    const syncInDecimal = await calculateSyncProgress(
      info.bestHeaderTimestamp
        ? String(info.bestHeaderTimestamp)
        : '1317969544',
      startingSyncTimestamp,
    );
    if (syncInDecimal < 0.9) {
      info.syncedToChain = false;
    }
    if (!info.syncedToChain) {
      info.decimalSynced = await calculateSyncProgress(
        info.bestHeaderTimestamp
          ? String(info.bestHeaderTimestamp)
          : '1317969544',
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

export const pollRecoveryInfo = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getRecoveryInfo()));
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
  const currentTimestamp: number = parseInt(
    String(new Date().getTime() / 1000),
    10,
  );

  const progressSoFarInSeconds: number =
    Number(bestHeaderTimestamp) - Number(startingSyncTimestamp);

  const totalProgressInSeconds =
    currentTimestamp - Number(startingSyncTimestamp);

  const decimalSynced = progressSoFarInSeconds / totalProgressInSeconds;

  return decimalSynced;
};

// slice
export const infoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {
    getPeersAction: (state, action) => ({...state, peers: action.payload}),
    getInfoAction: (state, action) => ({...state, ...action.payload}),
    checkInternetReachableAction: (state, action) => ({
      ...state,
      isInternetReachable: action.payload,
    }),
    getRecoveryInfoAction: (state, action) => ({...state, ...action.payload}),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

// selectors
export const decimalSyncedSelector = (state: RootState) =>
  state.info!.decimalSynced;
export const syncStatusSelector = (state: RootState) =>
  state.info!.syncedToChain;
export const recoveryProgressSelector = (state: RootState) =>
  state.info!.recoveryProgress;

export default infoSlice.reducer;
