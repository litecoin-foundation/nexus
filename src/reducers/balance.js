import * as Lnd from '../lib/lightning/onchain';

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
export const getBalance = () => async dispatch => {
  try {
    const {totalBalance, confirmedBalance, unconfirmedBalance} =
      await Lnd.walletBalance();
    const {balance, pendingOpenBalance} = await Lnd.getChannelBalance();

    dispatch({
      type: GET_BALANCE,
      totalBalance,
      confirmedBalance,
      unconfirmedBalance,
      balance,
      pendingOpenBalance,
    });
  } catch (error) {
    console.error(error);
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
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
