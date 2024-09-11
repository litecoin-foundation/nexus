import {createAction, createSlice} from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';

import {AppThunk} from './types';
import {poll} from '../lib/utils/poll';
import {RootState} from '../store';
import * as Lnd from '../lib/lightning';
import {lnrpc} from '../lib/lightning/proto/lightning';

// types
interface IInfo {
  identityPubkey: string;
  alias: string;
  version: string;
  syncedToChain: boolean;
  syncedToGraph: boolean;
  blockHeight: number;
  blockHash: string;
  bestHeaderTimestamp: number;
  uris: string[];
  chains: lnrpc.IChain[];
  numPeers: number;
  numActiveChannels: number;
  numPendingChannels: number;
  numInactiveChannels: number;
  testnet: boolean;
  isInternetReachable: boolean | null;
  startingSyncTimestamp: number;
  percentSynced: number | undefined;
}

type InfoWithoutInternetReachable = Omit<IInfo, 'isInternetReachable'>;

// initial state
const initialState = {
  identityPubkey: '',
  alias: '',
  version: '',
  syncedToChain: false,
  syncedToGraph: false,
  blockHeight: 0,
  blockHash: '',
  bestHeaderTimestamp: 0,
  uris: [],
  chains: [{chain: null, network: null}],
  numPeers: 0,
  numActiveChannels: 0,
  numPendingChannels: 0,
  numInactiveChannels: 0,
  testnet: false,
  isInternetReachable: null,
  startingSyncTimestamp: 0,
  percentSynced: 0,
} as IInfo;

// actions
const getInfoAction =
  createAction<InfoWithoutInternetReachable>('info/getInfoAction');
const checkInternetReachableAction = createAction<boolean | null>(
  'info/checkInternetReachableAction',
);

// functions
const getInfo = (): AppThunk => async (dispatch, getState) => {
  try {
    const infoRpc = await Lnd.getInfo();

    let info = {
      ...infoRpc,
      startingSyncTimestamp: 0,
      percentSynced: 0,
    };

    // RTK complains if values aren't correctly serialised
    const chains: lnrpc.IChain[] = [];
    const features: {[key: string]: lnrpc.IFeature} = {};

    for (const chainOption of infoRpc.chains) {
      let serializedChain = {
        chain: chainOption.chain,
        network: chainOption.network,
      };
      chains.push(serializedChain);
    }

    for (const featureKey in infoRpc.features) {
      const val = infoRpc.features[featureKey];
      let serializedFeature = {
        name: val.name,
        isRequired: val.isRequired,
        isKnown: val.isKnown,
      };

      features[featureKey] = serializedFeature;
    }

    info.chains = chains;
    info.features = features;

    // TODO: refactor required
    // first get neutrino cache before initwallet
    // then only calculate actual sync progress
    const {startingSyncTimestamp} = getState().info!;

    // calculate % synced
    if (startingSyncTimestamp === undefined) {
      info.startingSyncTimestamp = Number(info.bestHeaderTimestamp) || 0;
    }
    const syncPercentage = await calculateSyncProgress(
      info,
      startingSyncTimestamp,
    );
    if (syncPercentage < 0.9) {
      info.syncedToChain = false;
    }
    if (!info.syncedToChain) {
      info.percentSynced = await calculateSyncProgress(
        info,
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

export const checkInternetReachable = (): AppThunk => async dispatch => {
  NetInfo.addEventListener(state => {
    dispatch(checkInternetReachableAction(state.isInternetReachable));
  });
};

const calculateSyncProgress = async (
  info: InfoWithoutInternetReachable,
  startingSyncTimestamp: IInfo['startingSyncTimestamp'],
) => {
  const {bestHeaderTimestamp} = info;
  const currentTimestamp = new Date().getTime() / 1000;
  const progressSoFar = bestHeaderTimestamp
    ? Number(bestHeaderTimestamp) - startingSyncTimestamp!
    : 0;
  const totalProgress = currentTimestamp - startingSyncTimestamp! || 0.001;
  const percentSynced = (progressSoFar * 1.0) / totalProgress;
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
  },
});

// selectors
export const percentSyncedSelector = (state: RootState) =>
  state.info!.percentSynced;
export const syncStatusSelector = (state: RootState) =>
  state.info!.syncedToChain;

export default infoSlice.reducer;
