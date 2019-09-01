import Lightning from '../lib/lightning/lightning';
import {sleep} from '../lib/utils';

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
export const getTransactions = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const {transactions} = await LndInstance.sendCommand('GetTransactions');
    dispatch({
      type: GET_TRANSACTIONS,
      transactions,
    });
    await sleep();
  }
};

export const getInvoices = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const {invoices} = await LndInstance.sendCommand('GetInvoices');
    dispatch({
      type: GET_INVOICES,
      invoices,
    });
    await sleep();
  }
};

// action handlers
const actionHandler = {
  [GET_TRANSACTIONS]: (state, {transactions}) => ({...state, transactions}),
  [GET_INVOICES]: (state, {invoices}) => ({...state, invoices}),
};

// selectors

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
