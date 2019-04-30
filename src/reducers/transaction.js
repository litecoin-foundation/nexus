import Lightning from '../lib/lightning/lightning';
import { sleep } from '../lib/utils';

const LndInstance = new Lightning();

// initial state
const initialState = {
  transactions: []
};

// constants
export const GET_TRANSACTIONS = 'GET_TRANSACTIONS';

// actions
export const getTransactions = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const { transactions } = await LndInstance.sendCommand('GetTransactions');
    dispatch({
      type: GET_TRANSACTIONS,
      transactions
    });
    await sleep();
  }
};

// action handlers
const actionHandler = {
  [GET_TRANSACTIONS]: (state, { transactions }) => ({ ...state, transactions })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
