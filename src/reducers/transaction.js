import lnd from '@litecoinfoundation/react-native-lndltc';
import {createSelector} from '@reduxjs/toolkit';

import {formatDate, formatTime} from '../lib/utils/date';
import {getBalance} from './balance';

// initial state
const initialState = {
  transactions: [],
  invoices: [],
  memos: [],
};

// constants
export const GET_TRANSACTIONS = 'GET_TRANSACTIONS';
export const GET_INVOICES = 'GET_INVOICES';
export const SEND_ONCHAIN_PAYMENT = 'SEND_ONCHAIN_PAYMENT';
export const ESTIMATE_ONCHAIN_FEE = 'ESTIMATE_ONCHAIN_FEE';

// actions
export const subscribeTransactions = () => dispatch => {
  lnd.subscribeToOnChainTransactions(res => {
    if (res.isErr()) {
      return console.error(res.error);
    }

    dispatch(updateTransactions());
    dispatch(getBalance());
  });
};

export const subscribeInvoices = () => dispatch => {
  lnd.subscribeToInvoices(res => {
    if (res.isErr()) {
      return console.log(res.error);
    }

    dispatch(updateTransactions());
    dispatch(getBalance());
  });
};

export const getTransactions = () => async dispatch => {
  const rpc = await lnd.getTransactions();
  const {transactions} = rpc.value;
  let txs = [];

  transactions.forEach(tx => {
    let obj = {
      txHash: tx.txHash,
      amount: tx.amount,
      numConfirmations: tx.numConfirmations,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight,
      timeStamp: tx.timeStamp,
      fee: tx.total_fees,
      destAddresses: tx.destAddresses,
      label: tx.label,
    };
    txs.push(obj);
  });

  dispatch({
    type: GET_TRANSACTIONS,
    transactions: txs,
  });
};

const getInvoices = () => async dispatch => {
  // const rpc = await lnd.getInvoices();
  // const {invoices} = await LndInstance.sendCommand('listInvoices');
  // dispatch({
  //   type: GET_INVOICES,
  //   invoices,
  // });
};

const updateTransactions = () => async dispatch => {
  await Promise.all(dispatch(getTransactions()), dispatch(getInvoices()));
};

export const sendOnchainPayment =
  (address, amount, label = '') =>
  (dispatch, getState) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {confirmedBalance} = getState().balance;
        const sendAll = confirmedBalance === amount ? true : false;

        const rpc = await lnd.sendCoins(
          address,
          amount,
          undefined,
          undefined,
          sendAll,
          label,
        );
        if (rpc.isErr()) {
          reject(rpc.error);
        }

        if (rpc.isOk()) {
          const {txid} = rpc.value;
          dispatch({
            type: SEND_ONCHAIN_PAYMENT,
            txid,
            label,
          });
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

export const estimateOnchainFee =
  (address, amount, targetConf) => async dispatch => {
    try {
      const parsedAmount = parseFloat(amount) * 1000000;
      const rpc = await lnd.feeEstimate({address, parsedAmount, targetConf});

      if (rpc.isErr()) {
        console.error(`feeEstimate error: ${rpc.error}`);
      }

      if (rpc.isOk()) {
        const {feeSat, feerateSatPerByte} = rpc.value;
        dispatch({
          type: ESTIMATE_ONCHAIN_FEE,
          feeSat,
          feerateSatPerByte,
        });
      }
    } catch (error) {
      console.error(`feeEstimate error: ${error}`);
    }
  };

export const decodePaymentRequest = async payReqString => {
  const rpc = await lnd.decodeInvoice(payReqString);
  return rpc.value;
};

export const sendLightningPayment = paymentreq => async dispatch => {
  // try {
  //   const stream = LndInstance.sendStreamCommand('sendPayment');
  //   await new Promise((resolve, reject) => {
  //     stream.on('data', (data) => {
  //       if (data.paymentError) {
  //         reject(new Error(`Lightning payment error: ${data.paymentError}`));
  //       } else {
  //         resolve();
  //       }
  //     });
  //     stream.on('error', reject);
  //     stream.write(JSON.stringify({paymentRequest: paymentreq}), 'utf8');
  //   });
  // } catch (error) {
  //   alert('your transaction failed :(');
  //   console.log(`payment lightning error: ${error}`);
  // }
};

// action handlers
const actionHandler = {
  [GET_TRANSACTIONS]: (state, {transactions}) => ({
    ...state,
    transactions,
  }),
  [GET_INVOICES]: (state, {invoices}) => ({
    ...state,
    invoices,
  }),
  [SEND_ONCHAIN_PAYMENT]: (state, {txid, label}) => ({
    ...state,
    memos: [...state.memos, {[txid]: label}],
  }),
  [ESTIMATE_ONCHAIN_FEE]: (state, {fee_sat, feerate_sat_per_byte}) => ({
    ...state,
  }),
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

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
