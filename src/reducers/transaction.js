import {createSelector} from 'reselect';

import Lightning from '../lib/lightning/lightning';
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
export const getTransactions = () => dispatch => {
  const stream = LndInstance.sendStreamCommand('subscribeTransactions');
  stream.on('data', transaction => {
    dispatch({
      type: GET_TRANSACTIONS,
      transaction,
    });
  });
  stream.on('error', err => console.log(`SubscribeTransaction error: ${err}`));
  stream.on('status', status =>
    console.log(`SubscribeTransactions status: ${status}`),
  );
  stream.on('end', () => {
    console.log('SubscribeTransactions closed stream');
  });
};

export const getInvoices = () => dispatch => {
  const stream = LndInstance.sendStreamCommand('subscribeInvoices');
  stream.on('data', invoice => {
    dispatch({
      type: GET_INVOICES,
      invoice,
    });
  });
  stream.on('error', err => console.log(`SubscribeTransaction error: ${err}`));
  stream.on('status', status =>
    console.log(`SubscribeTransactions status: ${status}`),
  );
  stream.on('end', () => {
    console.log('SubscribeInvoices closed stream');
  });
};

// action handlers
const actionHandler = {
  [GET_TRANSACTIONS]: (state, {transaction}) => ({
    ...state,
    transactions: [...state.transactions, transaction],
  }),
  [GET_INVOICES]: (state, {invoice}) => ({
    ...state,
    invoices: [...state.invoices, invoice],
  }),
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
        sent: Math.sign(parseFloat(data.amount)) === -1 ? true : false,
      };
    }),
);

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
