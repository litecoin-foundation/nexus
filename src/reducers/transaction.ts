import * as LndOnchain from '../lib/lightning/onchain';
import * as LndWallet from '../lib/lightning/wallet';
import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {LndMobileEventEmitter} from '../lib/utils/event-listener';
import {formatDate, formatTime} from '../lib/utils/date';

// types
interface ITransaction {}

// initial state
const initialState = {
  transactions: [],
  invoices: [],
  memos: [],
} as ITransaction;

// actions
const getTransactionsAction = createAction('transaction/getTransactionsAction');

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
    let txs = [];

    transactions.forEach(tx => {
      let obj = {
        txHash: tx.txHash,
        amount: tx.amount,
        numConfirmations: tx.numConfirmations,
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        timeStamp: tx.timeStamp,
        fee: tx.totalFees,
        destAddresses: tx.destAddresses,
        label: tx.label,
      };
      txs.push(obj);
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
      const response = await LndWallet.publishTransaction(txHex);
      console.log('LOSHY');
      console.log(response.toJSON());

      if (response.publishError) {
        reject(response.publishError);
      }
      resolve('');
    } catch (error) {
      reject(String(error));
    }
  });
};

// selectors
const txSelector = state => state.transaction.transactions;

export const txDetailSelector = createSelector(txSelector, tx =>
  tx.map(data => {
    return {
      hash: data.txHash,
      amount: data.amount,
      day: formatDate(data.timeStamp * 1000),
      time: formatTime(data.timeStamp * 1000),
      timestamp: data.timeStamp,
      fee: data.fee,
      confs: data.numConfirmations,
      lightning: false,
      addresses: data.destAddresses,
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
