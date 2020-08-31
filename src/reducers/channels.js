import {Buffer} from 'buffer';
import {createSelector} from 'reselect';
import memoize from 'lodash.memoize';
import leven from 'leven';

import Lightning from '../lib/lightning/lightning';
import {handleChannelBackup} from '../lib/utils/backup';

const LndInstance = new Lightning();

// initial state
const initialState = {
  channels: [],
  peers: [],
  pending: {
    totalLimboBalance: null,
    pendingOpenChannels: [],
    pendingClosingChannels: [],
    pendingForceClosingChannels: [],
    waitingCloseChannels: [],
  },
  channelBackupsEnabled: false,
  nodes: [],
  edges: [],
};

// constants
export const LIST_CHANNELS = 'LIST_CHANNELS';
export const LIST_PENDING_CHANNELS = 'LIST_PENDING_CHANNELS';
export const LIST_PEERS = 'LIST_PEERS';
export const ENABLE_CHANNEL_BACKUP = 'ENABLE_CHANNEL_BACKUP';
export const GET_DESCRIBE_GRAPH = 'GET_DESCRIBE_GRAPH';

// actions
export const listChannels = () => async (dispatch) => {
  const {channels} = await LndInstance.sendCommand('ListChannels');
  dispatch({
    type: LIST_CHANNELS,
    channels,
  });
};

export const listPendingChannels = () => async (dispatch) => {
  const {
    totalLimboBalance,
    pendingOpenChannels,
    pendingClosingChannels,
    pendingForceClosingChannels,
    waitingCloseChannels,
  } = await LndInstance.sendCommand('PendingChannels');

  const mapPendingAttributes = (channel) => ({
    remotePubkey: channel.remoteNodePub,
    capacity: channel.capacity,
    localBalance: channel.localBalance,
    remoteBalance: channel.remoteBalance,
    channelPoint: channel.channelPoint,
  });
  const pocs = pendingOpenChannels.map((poc) => ({
    ...mapPendingAttributes(poc.channel),
    confirmationHeight: poc.confirmationHeight,
    blocksTillOpen: poc.blocksTillOpen,
    commitFee: poc.commitFee,
    feePerKw: poc.feePerKw,
  }));
  const pccs = pendingClosingChannels.map((pcc) => ({
    ...mapPendingAttributes(pcc.channel),
    closingTxId: pcc.closingTxid,
  }));
  const pfccs = pendingForceClosingChannels.map((pfcc) => ({
    ...mapPendingAttributes(pfcc.channel),
    closingTxId: pfcc.closingTxid,
    limboBalance: pfcc.limboBalance,
    maturityHeight: pfcc.maturityHeight,
    blocksTilMaturity: pfcc.blocksTilMaturity,
  }));
  const wccs = waitingCloseChannels.map((wcc) => ({
    ...mapPendingAttributes(wcc.channel),
    limboBalance: wcc.limboBalance,
  }));

  const pending = {};

  pending.totalLimboBalance = totalLimboBalance;
  pending.pendingOpenChannels = pocs;
  pending.pendingClosingChannels = pccs;
  pending.pendingForceClosingChannels = pfccs;
  pending.waitingCloseChannels = wccs;

  dispatch({
    type: LIST_PENDING_CHANNELS,
    pending,
  });
};

export const listPeers = () => async (dispatch) => {
  const {peers} = await LndInstance.sendCommand('ListPeers');
  dispatch({
    type: LIST_PEERS,
    peers,
  });
};

export const connectToPeer = async (input) => {
  const pubkey = input.split('@')[0];
  const host = input.split('@')[1];

  try {
    await LndInstance.sendCommand('ConnectPeer', {
      addr: {host, pubkey},
    });
  } catch (error) {
    console.log(error);
  }
};

export const openChannel = async (pubkey, amount) => {
  try {
    const stream = LndInstance.sendStreamCommand('OpenChannel', {
      nodePubkey: Buffer.from(pubkey, 'hex'),
      localFundingAmount: amount,
      private: true,
    });
    await new Promise((resolve, reject) => {
      stream.on('data', () => console.log('update channel data'));
      stream.on('status', (status) =>
        console.log(`CHANNEL: update in channel status:  ${status}`),
      );
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  } catch (error) {
    console.log(error);
  }
};

export const enableChannelBackup = () => (dispatch) => {
  dispatch({
    type: ENABLE_CHANNEL_BACKUP,
  });
};

export const backupChannels = () => async (dispatch, getState) => {
  const {channelBackupsEnabled} = getState().channels;
  if (!channelBackupsEnabled) {
    return;
  }

  const stream = LndInstance.sendStreamCommand('subscribeChannelBackups');
  stream.on('data', () => handleChannelBackup());
  stream.on('error', (err) => console.log('Channel backup error:', err));
  stream.on('status', (status) =>
    console.log(`Channel backup status: ${status}`),
  );
};

export const getDescribeGraph = () => async (dispatch) => {
  const {nodes, edges} = await LndInstance.sendCommand('DescribeGraph', {
    include_unannounced: false,
  });

  dispatch({
    type: GET_DESCRIBE_GRAPH,
    nodes,
    edges,
  });
};

// action handlers
const actionHandler = {
  [LIST_CHANNELS]: (state, {channels}) => ({...state, channels}),
  [LIST_PENDING_CHANNELS]: (state, {pending}) => ({...state, pending}),
  [LIST_PEERS]: (state, {peers}) => ({...state, peers}),
  [ENABLE_CHANNEL_BACKUP]: (state) => ({...state, channelBackupsEnabled: true}),
  [GET_DESCRIBE_GRAPH]: (state, {nodes, edges}) => ({...state, nodes, edges}),
};

// selectors

export const searchGraph = createSelector(
  (state) => state.channels.nodes,
  (nodes) =>
    memoize((searchTerm) => {
      // remove all nodes with no alias
      const a1 = nodes.filter((node) => {
        return node.alias !== undefined;
      });

      const a2 = a1.filter((node) => {
        return node.alias !== '';
      });

      // filter nodes based on levenstein score
      // searchTerm and node alias are normalised
      // TODO: .filter() seems to have issues here
      let arr = [];
      for (let i = 0; i < a2.length; i++) {
        if (
          leven(
            a2[i].alias.toLowerCase().replace(/[^a-zA-Z ]/g, ''),
            searchTerm.toLowerCase().replace(/[^a-zA-Z ]/g, ''),
          ) < 6
        ) {
          arr.push(a2[i]);
        }
      }

      // sort array by lowest levenstein score
      // lower is more accurate
      let sortedArray = arr.sort(
        (a, b) =>
          leven(a.alias.toLowerCase(), searchTerm.toLowerCase()) -
          leven(b.alias.toLowerCase(), searchTerm.toLowerCase()),
      );
      return sortedArray;
    }),
);

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
