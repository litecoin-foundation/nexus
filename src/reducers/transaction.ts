import * as LndOnchain from '../lib/lightning/onchain';
import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {LndMobileEventEmitter} from '../lib/utils/event-listener';
import {formatDate, formatTime} from '../lib/utils/date';
import {lnrpc} from '../lib/lightning/proto/lightning';

// types
type IDecodedTx = {
  txHash: lnrpc.ITransaction['txHash'];
  amount: lnrpc.ITransaction['amount'];
  numConfirmations: lnrpc.ITransaction['numConfirmations'];
  blockHash: lnrpc.ITransaction['blockHash'];
  blockHeight: lnrpc.ITransaction['blockHeight'];
  timeStamp: lnrpc.ITransaction['timeStamp'];
  fee: lnrpc.ITransaction['totalFees'];
  destAddresses: lnrpc.ITransaction['destAddresses'];
  outputDetails: lnrpc.ITransaction['outputDetails'];
  previousOutpoints: lnrpc.ITransaction['previousOutpoints'];
  label: lnrpc.ITransaction['label'];
};

interface ITx {
  transactions: IDecodedTx[];
}

// initial state
const initialState = {
  transactions: [],
  invoices: [],
  memos: [],
} as ITx;

// actions
const getTransactionsAction = createAction<IDecodedTx[]>(
  'transaction/getTransactionsAction',
);

// functions
export const subscribeTransactions = (): AppThunk => async dispatch => {
  try {
    await LndOnchain.subscribeTransactions();
    LndMobileEventEmitter.addListener('SubscribeTransactions', async event => {
      const transaction = LndOnchain.decodeSubscribeTransactionsResult(
        event.data,
      );

      if (transaction) {
        //
        dispatch(getTransactions());
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export const getTransactions = (): AppThunk => async dispatch => {
  try {
    const {transactions} = await LndOnchain.getTransactions();
    let txs: IDecodedTx[] = [];

    transactions.forEach(tx => {
      // deserialisation
      const destAddresses: string[] = [];
      tx.destAddresses?.forEach(addresses => {
        destAddresses.push(addresses);
      });
      const outputDetails: lnrpc.IOutputDetail[] = [];
      tx.outputDetails?.forEach(outputDetail => {
        outputDetails.push(outputDetail);
      });
      const previousOutpoints: lnrpc.IPreviousOutPoint[] = [];
      tx.previousOutpoints?.forEach(prevOutpoint => {
        previousOutpoints.push(prevOutpoint);
      });

      let decodedTx = {
        txHash: tx.txHash,
        amount: tx.amount,
        numConfirmations: tx.numConfirmations,
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        timeStamp: tx.timeStamp,
        fee: tx.totalFees,
        destAddresses,
        outputDetails,
        previousOutpoints,
        label: tx.label,
      };
      txs.push(decodedTx);
    });

    dispatch(getTransactionsAction(txs));
  } catch (error) {
    console.error(error);
  }
};

export const sendOnchainPayment =
  (address: string, amount: number, label = ''): AppThunk =>
  (dispatch, getState) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {confirmedBalance} = getState().balance;
        const sendAll = confirmedBalance === amount ? true : false;

        try {
          let txid;
          if (sendAll) {
            txid = (await LndOnchain.sendCoinsAll(address, undefined, label))
              .txid;
          } else {
            txid = (
              await LndOnchain.sendCoins(address, amount, undefined, label)
            ).txid;
          }

          resolve(txid);
        } catch (error) {
          reject(String(error));
        }
      } catch (error) {
        reject(String(error));
      }
    });
  };

export const publishTransaction = (txHex: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const request = await fetch('https://litecoinspace.org/api/tx', {
        method: 'POST',
        body: txHex,
      });

      if (!request.ok) {
        const error = await request.text();
        reject(`Tx Broadcast failed: ${error}`);
      }

      const response = await request.text();
      console.log(response);
      // TODO: verify this reponse is just txid

      resolve(response);
    } catch (error) {
      reject(String(error));
    }
  });
};

// selectors
const txSelector = (state: any) => state.transaction.transactions;

export const txDetailSelector = createSelector(txSelector, tx =>
  tx.map((data: any) => {
    const addresses: string[] = [];
    data.outputDetails?.forEach((outputDetail: any) => {
      addresses.push(outputDetail.address);
    });

    return {
      hash: data.txHash,
      blockHeight: data.blockHeight,
      amount: data.amount,
      day: formatDate(data.timeStamp * 1000),
      time: formatTime(data.timeStamp * 1000),
      timestamp: data.timeStamp,
      fee: data.fee,
      confs: data.numConfirmations,
      lightning: false,
      addresses: addresses,
      inputTxs: data.previousOutpoints,
      sent: Math.sign(parseFloat(data.amount)) === -1 ? true : false,
    };
  }),
);

// slice
export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    getTransactionsAction: (state, action) => ({
      ...state,
      transactions: action.payload,
    }),
  },
});

export default transactionSlice.reducer;
