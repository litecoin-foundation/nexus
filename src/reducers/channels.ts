import lnd, {lnrpc} from '@litecoinfoundation/react-native-lndltc';
import {createSelector} from 'reselect';
import memoize from 'lodash.memoize';
import leven from 'leven';

import {handleChannelBackup} from '../lib/utils/backup';
import {AppThunk, IActionHandler, ReduxType} from './types';
import {AnyAction} from '@reduxjs/toolkit';

// types
interface IChannelState {
  channels: [];
  peers: [];
  pending: {
    totalLimboBalance: null;
    pendingOpenChannels: [];
    pendingClosingChannels: [];
    pendingForceClosingChannels: [];
    waitingCloseChannels: [];
  };
  channelBackupsEnabled: boolean;
  nodes: [];
  edges: [];
}

// initial state
const initialState: IChannelState = {
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
export const LIST_CHANNELS: ReduxType = 'LIST_CHANNELS';
export const LIST_PENDING_CHANNELS: ReduxType = 'LIST_PENDING_CHANNELS';
export const LIST_PEERS: ReduxType = 'LIST_PEERS';
export const ENABLE_CHANNEL_BACKUP: ReduxType = 'ENABLE_CHANNEL_BACKUP';
export const GET_DESCRIBE_GRAPH: ReduxType = 'GET_DESCRIBE_GRAPH';

// actions
export const listChannels = (): AppThunk => async dispatch => {
  try {
    const rpc = await lnd.listChannels();

    if (rpc.isErr()) {
      console.error(rpc.error);
    }

    if (rpc.isOk()) {
      let arr: lnrpc.IChannel[] = [];
      rpc.value.channels.forEach((channel: lnrpc.IChannel) =>
        arr.push(channel),
      );

      dispatch({
        type: LIST_CHANNELS,
        channels: arr,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const listPendingChannels = (): AppThunk => async dispatch => {
  try {
    // TODO: implement when listPendingChannels api available in rn-lndltc
  } catch (error) {
    console.error(error);
  }
};

export const listPeers = (): AppThunk => async dispatch => {
  try {
    const rpc = await lnd.listPeers();

    if (rpc.isErr()) {
      console.error(rpc.error);
    }

    if (rpc.isOk()) {
      let arr: lnrpc.IPeer[] = [];
      console.log(rpc.value);

      rpc.value.peers.forEach((peer: lnrpc.IPeer) => {
        arr.push({
          pubKey: peer.pubKey,
          address: peer.address,
          bytesSent: peer.bytesSent,
          bytesRecv: peer.bytesRecv,
          syncType: peer.syncType,
          flapCount: peer.flapCount,
          lastFlapNs: peer.lastFlapNs,
        });
      });
      dispatch({
        type: LIST_PEERS,
        peers: arr,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const connectToPeer = async (input: string) => {
  const pubkey = input.split('@')[0];
  const host = input.split('@')[1];
  console.error(pubkey);
  console.error(host);

  try {
    const rpc = await lnd.connectPeer(
      '027a2fde010babcefeb875ca7729aeb3303c53127ef48f8c85eeaa1a29b2e14ace',
      '86.10.110.143:9735',
    );
    if (rpc.isErr()) {
      console.error(rpc.error);
    }
  } catch (error) {
    console.error(error);
  }
};

export const openChannel = async (pubkey: string, amount: number) => {
  try {
    const rpc = await lnd.openChannel(amount, pubkey);

    if (rpc.isErr()) {
      console.error(rpc.error);
    }

    if (rpc.isOk()) {
      // implement later
    }
  } catch (error) {
    console.error(error);
  }
};

export const enableChannelBackup = (): AppThunk => dispatch => {
  dispatch({
    type: ENABLE_CHANNEL_BACKUP,
  });
};

export const backupChannels = (): AppThunk => async (dispatch, getState) => {
  const {channelBackupsEnabled} = getState().channels;
  if (!channelBackupsEnabled) {
    return;
  }

  try {
    await lnd.subscribeToBackups(
      rpc => {
        if (rpc.isErr()) {
          console.error(rpc.error);
        }

        if (rpc.isOk()) {
          handleChannelBackup();
        }
      },
      () => console.log('end subscription'),
    );
  } catch (error) {
    console.error(error);
  }
};

export const getDescribeGraph = (): AppThunk => async dispatch => {
  try {
    const rpc = await lnd.describeGraph();

    if (rpc.isErr()) {
      console.error(rpc.error);
    }

    if (rpc.isOk()) {
      let nodes: lnrpc.ILightningNode[] = [];
      let edges: lnrpc.IChannelEdge[] = [];

      rpc.value.nodes.forEach((node: lnrpc.ILightningNode) => {
        let addresses: lnrpc.INodeAddress[] = [];

        node.addresses?.map(address => {
          addresses.push({
            network: address.network,
            addr: address.addr,
          });
        });

        nodes.push({
          lastUpdate: node.lastUpdate,
          pubKey: node.pubKey,
          alias: node.alias === null || undefined ? '' : node.alias,
          addresses,
          color: node.color,
        });
      });

      rpc.value.edges.forEach((edge: lnrpc.IChannelEdge) => {
        edges.push({
          channelId: edge.channelId,
          chanPoint: edge.chanPoint,
          lastUpdate: edge.lastUpdate,
          node1Pub: edge.node1Pub,
          node2Pub: edge.node2Pub,
          node1Policy: {
            timeLockDelta: edge.node1Policy?.timeLockDelta,
            minHtlc: edge.node1Policy?.minHtlc,
            feeBaseMsat: edge.node1Policy?.feeBaseMsat,
            feeRateMilliMsat: edge.node1Policy?.feeRateMilliMsat,
            maxHtlcMsat: edge.node1Policy?.maxHtlcMsat,
            lastUpdate: edge.node1Policy?.lastUpdate,
          },
          node2Policy: {
            timeLockDelta: edge.node2Policy?.timeLockDelta,
            minHtlc: edge.node2Policy?.minHtlc,
            feeBaseMsat: edge.node2Policy?.feeBaseMsat,
            feeRateMilliMsat: edge.node2Policy?.feeRateMilliMsat,
            disabled: edge.node2Policy?.disabled,
            maxHtlcMsat: edge.node2Policy?.maxHtlcMsat,
            lastUpdate: edge.node2Policy?.lastUpdate,
          },
        });
      });

      dispatch({
        type: GET_DESCRIBE_GRAPH,
        nodes,
        edges,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

// action handlers
const actionHandler: IActionHandler = {
  [LIST_CHANNELS]: (state, {channels}) => ({...state, channels}),
  [LIST_PENDING_CHANNELS]: (state, {pending}) => ({...state, pending}),
  [LIST_PEERS]: (state, {peers}) => ({...state, peers}),
  [ENABLE_CHANNEL_BACKUP]: state => ({...state, channelBackupsEnabled: true}),
  [GET_DESCRIBE_GRAPH]: (state, {nodes, edges}) => ({...state, nodes, edges}),
};

// selectors

export const searchGraph = createSelector(
  state => state.channels.nodes,
  nodes =>
    memoize(searchTerm => {
      // remove all nodes with no alias
      const a1 = nodes.filter((node: lnrpc.ILightningNode) => {
        return node.alias !== undefined;
      });

      const a2 = a1.filter((node: lnrpc.ILightningNode) => {
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
export default function (state = initialState, action: AnyAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
