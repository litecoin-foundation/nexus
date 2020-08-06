import {createSelector} from 'reselect';

import Lightning from '../lib/lightning/lightning';
import {formatDate, formatTime} from '../lib/utils/date';

const LndInstance = new Lightning();

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
export const subscribeTransactions = () => (dispatch) => {
  const stream = LndInstance.sendStreamCommand('subscribeTransactions');
  stream.on('data', async () => {
    await new Promise((r) => setTimeout(r, 500));
    dispatch(updateTransactions());
  });
  stream.on('error', (err) =>
    console.log(`SubscribeTransaction error: ${err}`),
  );
  stream.on('status', (status) =>
    console.log(`SubscribeTransactions status: ${status}`),
  );
  stream.on('end', () => {
    console.log('SubscribeTransactions closed stream');
  });
};

export const subscribeInvoices = () => (dispatch) => {
  const stream = LndInstance.sendStreamCommand('subscribeInvoices');
  stream.on('data', () => dispatch(updateTransactions()));
  stream.on('error', (err) =>
    console.log(`SubscribeTransaction error: ${err}`),
  );
  stream.on('status', (status) =>
    console.log(`SubscribeTransactions status: ${status}`),
  );
  stream.on('end', () => {
    console.log('SubscribeInvoices closed stream');
  });
};

export const getTransactions = () => async (dispatch) => {
  const {transactions} = await LndInstance.sendCommand('getTransactions');
  dispatch({
    type: GET_TRANSACTIONS,
    transactions,
  });
};

const getInvoices = () => async (dispatch) => {
  const {invoices} = await LndInstance.sendCommand('listInvoices');
  dispatch({
    type: GET_INVOICES,
    invoices,
  });
};

const updateTransactions = () => async (dispatch) => {
  await Promise.all(dispatch(getTransactions()), dispatch(getInvoices()));
};

export const sendOnchainPayment = (paymentreq) => (dispatch) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {txid} = await LndInstance.sendCommand('SendCoins', paymentreq);
      dispatch({
        type: SEND_ONCHAIN_PAYMENT,
        txid,
        label:
          paymentreq.label === '' || paymentreq.label === undefined
            ? ''
            : paymentreq.label,
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const estimateOnchainFee = (address, amount, conf) => async (
  dispatch,
) => {
  try {
    const AddrToAmount = {};
    AddrToAmount[address] = parseFloat(amount) * 1000000;
    const blocksToConfirm = conf !== undefined || isNaN(conf) ? conf : 1;
    const {fee_sat, feerate_sat_per_byte} = await LndInstance.sendCommand(
      'EstimateFee',
      {
        AddrToAmount,
        target_conf: blocksToConfirm,
      },
    );

    dispatch({
      type: ESTIMATE_ONCHAIN_FEE,
      fee_sat,
      feerate_sat_per_byte,
    });
  } catch (error) {
    alert(`fee calculation ${error}`);
    console.log(`payment onchain error: ${error}`);
  }
};

export const decodePaymentRequest = async (payReqString) => {
  const response = await LndInstance.sendCommand('DecodePayReq', {
    payReq: payReqString,
  });
  return response;
};

export const sendLightningPayment = (paymentreq) => async (dispatch) => {
  try {
    const stream = LndInstance.sendStreamCommand('sendPayment');
    await new Promise((resolve, reject) => {
      stream.on('data', (data) => {
        if (data.paymentError) {
          reject(new Error(`Lightning payment error: ${data.paymentError}`));
        } else {
          resolve();
        }
      });
      stream.on('error', reject);
      stream.write(JSON.stringify({paymentRequest: paymentreq}), 'utf8');
    });
  } catch (error) {
    alert('your transaction failed :(');
    console.log(`payment lightning error: ${error}`);
  }
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
const txSelector = (state) => state.transaction.transactions;

export const txDetailSelector = createSelector(txSelector, (tx) =>
  tx.map((data) => {
    return {
      name:
        Math.sign(parseFloat(data.amount)) === -1
          ? 'Sent Litecoin'
          : 'Received Litecoin',
      hash: data.txHash,
      amount: data.amount,
      day: formatDate(data.timeStamp * 1000),
      time: formatTime(data.timeStamp),
      fee: data.totalFees,
      confs: data.numConfirmations,
      type: 'litecoin onchain',
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
