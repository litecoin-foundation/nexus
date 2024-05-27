import memoize from 'lodash.memoize';
import leven from 'leven';

import {handleChannelBackup} from '../lib/utils/backup';
import {AppThunk} from './types';
import {
  createAction,
  createSlice,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import {RootState} from '../store';
import {lnrpc} from '../lib/lightning/proto/lightning';
import * as Lnd from '../lib/lightning';
import * as LndChannel from '../lib/lightning/channel';

// types
interface IChannelState {
  channels: lnrpc.IChannel[];
  peers: lnrpc.IPeer[];
  pending: lnrpc.IPendingChannelsResponse;
  channelBackupsEnabled: boolean;
  nodes: lnrpc.ILightningNode[];
  edges: lnrpc.IChannelEdge[];
}

type IGraph = {
  nodes: lnrpc.ILightningNode[];
  edges: lnrpc.IChannelEdge[];
};

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

// actions
const listChannelAction = createAction<lnrpc.IChannel[]>(
  'channels/listChannelAction',
);
const listPeersAction = createAction<lnrpc.IPeer[]>('channels/listPeersAction');
export const enableChannelBackup = createAction('channels/enableChannelBackup');
const describeGraphAction = createAction<IGraph>(
  'channels/describeGraphAction',
);

// functions
export const listChannels = (): AppThunk => async dispatch => {
  try {
    const rpc = await LndChannel.listChannels();

    let arr: lnrpc.IChannel[] = [];
    rpc.channels.forEach((channel: lnrpc.IChannel) => arr.push(channel));

    dispatch(listChannelAction(arr));
  } catch (error) {
    console.error(error);
  }
};

// export const listPendingChannels = (): AppThunk => async dispatch => {
//   try {
//     // TODO: implement when listPendingChannels api available in rn-lndltc
//   } catch (error) {
//     console.error(error);
//   }
// };

export const listPeers = (): AppThunk => async dispatch => {
  try {
    const rpc = await Lnd.listPeers();

    let arr: lnrpc.IPeer[] = [];

    rpc.peers.forEach((peer: lnrpc.IPeer) => {
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
    dispatch(listPeersAction(arr));
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
    await Lnd.connectPeer(
      '027a2fde010babcefeb875ca7729aeb3303c53127ef48f8c85eeaa1a29b2e14ace',
      '86.10.110.143:9735',
    );
  } catch (error) {
    console.error(error);
  }
};

export const openChannel = async (pubkey: string, amount: number) => {
  try {
    await LndChannel.openChannel(pubkey, amount, false);

    // implement later
  } catch (error) {
    console.error(error);
  }
};

export const backupChannels = (): AppThunk => async (dispatch, getState) => {
  const {channelBackupsEnabled} = getState().channels!;
  if (!channelBackupsEnabled) {
    return;
  }

  try {
    // await lnd.subscribeToBackups(
    //   rpc => {
    //     if (rpc.isErr()) {
    //       console.error(rpc.error);
    //     }
    //     if (rpc.isOk()) {
    //       handleChannelBackup();
    //     }
    //   },
    //   () => console.log('end subscription'),
    // );
  } catch (error) {
    console.error(error);
  }
};

export const getDescribeGraph = (): AppThunk => async dispatch => {
  try {
    const rpc = await Lnd.describeGraph();

    let nodes: lnrpc.ILightningNode[] = [];
    let edges: lnrpc.IChannelEdge[] = [];

    rpc.nodes.forEach((node: lnrpc.ILightningNode) => {
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

    rpc.edges.forEach((edge: lnrpc.IChannelEdge) => {
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

    dispatch(
      describeGraphAction({
        nodes,
        edges,
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

// selectors
export const searchGraph = createSelector(
  (state: RootState) => state.channels!.nodes,
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
            a2[i].alias!.toLowerCase().replace(/[^a-zA-Z ]/g, ''),
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
          leven(a.alias!.toLowerCase(), searchTerm.toLowerCase()) -
          leven(b.alias!.toLowerCase(), searchTerm.toLowerCase()),
      );
      return sortedArray;
    }),
);

// slice
export const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    listChannelAction: (state, action: PayloadAction<lnrpc.IChannel[]>) => ({
      ...state,
      channels: action.payload,
    }),
    listPeersAction: (state, action: PayloadAction<lnrpc.IPeer[]>) => ({
      ...state,
      peers: action.payload,
    }),
    enableChannelBackup: state => ({...state, channelBackupsEnabled: true}),
    describeGraphAction: (state, action) => ({
      ...state,
      nodes: action.payload.nodes,
      edges: action.payload.edges,
    }),
  },
});

export default channelsSlice.reducer;
