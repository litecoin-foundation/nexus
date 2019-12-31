import {createSelector} from 'reselect';

import Lightning from '../lib/lightning/lightning';
import {poll} from '../lib/utils/poll';
import {formatDate, formatTime} from '../lib/utils/date';

const LndInstance = new Lightning();

// initial state
const initialState = {
  transactions: [],
  invoices: [],
};

// constants
export const GET_TRANSACTIONS = 'GET_TRANSACTIONS';
export const GET_INVOICES = 'GET_INVOICES';

// actions
export const getTransactions = () => async dispatch => {
  const {transactions} = await LndInstance.sendCommand('GetTransactions');
  dispatch({
    type: GET_TRANSACTIONS,
    transactions,
  });
};

export const pollTransactions = () => async dispatch => {
  await poll(() => dispatch(getTransactions()));
};

export const getInvoices = () => async dispatch => {
  const {invoices} = await LndInstance.sendCommand('GetInvoices');
  dispatch({
    type: GET_INVOICES,
    invoices,
  });
};

export const pollInvoices = () => async dispatch => {
  await poll(() => dispatch(getInvoices()));
};

// action handlers
const actionHandler = {
  [GET_TRANSACTIONS]: (state, {transactions}) => ({...state, transactions}),
  [GET_INVOICES]: (state, {invoices}) => ({...state, invoices}),
};

// selectors
const txSelector = state => state.transaction.transactions;

export const txDetailSelector = createSelector(
  txSelector,
  tx =>
    tx.map(data => {
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
      };
    }),
);

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
