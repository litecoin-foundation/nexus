import Lightning from '../lib/lightning/lightning';
import {sleep} from '../lib/utils';

const LndInstance = new Lightning();

// initial state
const initialState = {
  totalBalance: null,
  confirmedBalance: null,
  unconfirmedBalance: null,
  balance: null,
  pendingOpenBalance: null,
};

// constants
export const GET_BALANCE = 'GET_BALANCE';

// actions
export const getBalance = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const w = await LndInstance.sendCommand('WalletBalance');
    const c = await LndInstance.sendCommand('ChannelBalance');
    const {totalBalance, confirmedBalance, unconfirmedBalance} = w;
    const {balance, pendingOpenBalance} = c;

    dispatch({
      type: GET_BALANCE,
      totalBalance,
      confirmedBalance,
      unconfirmedBalance,
      balance,
      pendingOpenBalance,
    });
    await sleep();
  }
};

// action handlers
const actionHandler = {
  [GET_BALANCE]: (
    state,
    {
      totalBalance,
      confirmedBalance,
      unconfirmedBalance,
      balance,
      pendingOpenBalance,
    },
  ) => ({
    ...state,
    totalBalance,
    confirmedBalance,
    unconfirmedBalance,
    balance,
    pendingOpenBalance,
  }),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
