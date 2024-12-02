import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {
  getTransactions as getLndTransactions,
  sendCoins,
  subscribeTransactions as subscribeLndTransactions,
} from 'react-native-turbo-lnd';
import {
  GetTransactionsRequestSchema,
  OutputScriptType,
  PreviousOutPoint,
} from 'react-native-turbo-lnd/protos/lightning_pb';
import {create} from '@bufbuild/protobuf';

import {AppThunk} from './types';
import {formatDate, formatTime} from '../lib/utils/date';
import {getBalance} from './balance';

// types
type IDecodedTx = {
  txHash: string;
  amount: Number;
  numConfirmations: number;
  blockHash: string;
  blockHeight: number;
  timeStamp: string;
  fee: Number;
  destAddresses: string[];
  outputDetails: IOutputDetails[];
  previousOutpoints: PreviousOutPoint[];
  label: string | null | undefined;
};

type IOutputDetails = {
  address: string;
  amount: Number;
  isOurAddress: boolean;
  outputIndex: number;
  outputType: OutputScriptType;
  pkScript: string;
};

interface ITx {
  txSubscriptionStarted: boolean;
  transactions: IDecodedTx[];
}

// initial state
const initialState = {
  txSubscriptionStarted: false,
  transactions: [],
  invoices: [],
  memos: [],
} as ITx;

// actions
const getTransactionsAction = createAction<IDecodedTx[]>(
  'transaction/getTransactionsAction',
);
const txSubscriptionStartedAction = createAction<boolean>(
  'transaction/txSubscriptionStartedAction',
);

// functions
export const subscribeTransactions =
  (): AppThunk => async (dispatch, getState) => {
    const {txSubscriptionStarted} = getState().transaction;
    try {
      if (!txSubscriptionStarted) {
        dispatch(txSubscriptionStartedAction(true));

        subscribeLndTransactions(
          {},
          async transaction => {
            try {
              console.log(`new tx detected!: ${transaction}`);
              dispatch(getTransactions());
              dispatch(getBalance());
            } catch (error) {
              dispatch(txSubscriptionStartedAction(false));
              throw new Error(String(error));
            }
          },
          error => {
            console.error(error);
          },
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

export const getTransactions = (): AppThunk => async (dispatch, getState) => {
  const {buyHistory, sellHistory} = getState().buy;

  try {
    const transactions = await getLndTransactions(
      create(GetTransactionsRequestSchema),
    );

    let txs: IDecodedTx[] = [];

    // TODO: decode and add metadata on transaction info.
    // If Buy/Sell transaction, this must be labelled as such

    transactions.transactions.forEach(tx => {
      // deserialisation
      const destAddresses: string[] = [];
      tx.destAddresses?.forEach(addresses => {
        destAddresses.push(addresses);
      });
      const outputDetails: IOutputDetails[] = [];
      tx.outputDetails?.forEach(outputDetail => {
        const output: IOutputDetails = {
          address: outputDetail.address,
          amount: Number(outputDetail.amount),
          isOurAddress: outputDetail.isOurAddress,
          outputIndex: Number(outputDetail.outputIndex),
          outputType: outputDetail.outputType,
          pkScript: outputDetail.pkScript,
        };
        outputDetails.push(output);
      });
      const previousOutpoints: PreviousOutPoint[] = [];
      tx.previousOutpoints?.forEach(prevOutpoint => {
        previousOutpoints.push(prevOutpoint);
      });

      let metaLabel = '';

      if (buyHistory && buyHistory.length >= 1) {
        if (buyHistory.filter((buyTx) => buyTx === tx.txHash)) {
          metaLabel = 'Buy';
        }
      } else if (sellHistory && sellHistory.length >= 1) {
        if (sellHistory.filter((selTx) => selTx === tx.txHash)) {
          metaLabel = 'Sell';
        }
      }

      let decodedTx = {
        txHash: tx.txHash,
        amount: Number(tx.amount),
        numConfirmations: tx.numConfirmations,
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        timeStamp: String(tx.timeStamp),
        fee: Number(tx.totalFees),
        destAddresses,
        outputDetails,
        previousOutpoints,
        label: tx.label,
        metaLabel: metaLabel,
      };
      txs.push(decodedTx);
    });

    dispatch(getTransactionsAction(txs));
  } catch (error) {
    console.error(error);
  }
};

export const sendOnchainPayment =
  (
    address: string,
    amount: number,
    label: string | undefined = undefined,
    fee: number | undefined = undefined,
  ): AppThunk =>
  (dispatch, getState) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {confirmedBalance} = getState().balance;
        const sendAll = Number(confirmedBalance) === amount ? true : false;

        try {
          if (sendAll) {
            const response = await sendCoins({
              sendAll: true,
              addr: address,
              satPerVbyte: fee ? BigInt(fee) : undefined,
            });
            resolve(response.txid);
            return;
          } else {
            const response = await sendCoins({
              addr: address,
              amount: BigInt(amount),
              satPerVbyte: fee ? BigInt(fee) : undefined,
              label: label ? label : undefined,
            });
            resolve(response.txid);
            return;
          }
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
      day: formatDate(Number(data.timeStamp) * 1000),
      time: formatTime(Number(data.timeStamp) * 1000),
      timestamp: data.timeStamp,
      fee: data.fee,
      confs: data.numConfirmations,
      lightning: false,
      addresses: addresses,
      inputTxs: data.previousOutpoints,
      sent: Math.sign(parseFloat(data.amount)) === -1 ? true : false,
      label: data.label,
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
    txSubscriptionStartedAction: (state, action) => ({
      ...state,
      txSubscriptionStarted: action.payload,
    }),
  },
});

export default transactionSlice.reducer;
