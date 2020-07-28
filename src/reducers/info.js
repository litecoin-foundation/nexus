import NetInfo from '@react-native-community/netinfo';

import Lightning from '../lib/lightning/lightning';
import {poll} from '../lib/utils/poll';

const LndInstance = new Lightning();

// initial state
const initialState = {
  identityPubkey: '',
  alias: '',
  version: '',
  syncedToChain: false,
  blockHeight: 0,
  blockHash: '',
  bestHeaderTimestamp: 0,
  uris: [],
  chains: [],
  isInternetReachable: null,
};

// constants
export const GET_INFO = 'GET_INFO';
export const IS_INTERNET_REACHABLE = 'IS_INTERNET_REACHABLE';

// actions
export const getInfo = () => async (dispatch, getState) => {
  const info = await LndInstance.sendCommand('getInfo');
  const {startingSyncTimestamp} = getState().info;

  if (startingSyncTimestamp === undefined) {
    info.startingSyncTimestamp = info.bestHeaderTimestamp || 0;
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

  dispatch({
    type: GET_INFO,
    info,
  });
};

export const isInternetReachable = () => (dispatch) => {
  NetInfo.addEventListener((state) => {
    dispatch({
      type: IS_INTERNET_REACHABLE,
      isInternetReachable: state.isInternetReachable,
    });
  });
};

export const pollInfo = () => async (dispatch) => {
  await poll(() => dispatch(getInfo()));
};

const calculateSyncProgress = async (info, startingSyncTimestamp) => {
  const {bestHeaderTimestamp} = info;
  const currentTimestamp = new Date().getTime() / 1000;
  const progressSoFar = bestHeaderTimestamp
    ? bestHeaderTimestamp - startingSyncTimestamp
    : 0;
  const totalProgress = currentTimestamp - startingSyncTimestamp || 0.001;
  const percentSynced = (progressSoFar * 1.0) / totalProgress;
  return percentSynced;
};

// action handlers
const actionHandler = {
  [GET_INFO]: (state, {info}) => ({
    ...state,
    ...info,
  }),
  [IS_INTERNET_REACHABLE]: (state, {isInternetReachable}) => ({
    ...state,
    isInternetReachable,
  }),
};

// selectors
export const percentSyncedSelector = (state) => state.info.percentSynced;
export const syncStatusSelector = (state) => state.info.syncedToChain;

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
