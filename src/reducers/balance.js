import lnd from '@litecoinfoundation/react-native-lndltc';

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
  const w = await lnd.getWalletBalance();
  const c = await lnd.getChannelBalance();

  const {totalBalance, confirmedBalance, unconfirmedBalance} = w.value;
  const {balance, pendingOpenBalance} = c.value;

  dispatch({
    type: GET_BALANCE,
    totalBalance,
    confirmedBalance,
    unconfirmedBalance,
    balance,
    pendingOpenBalance,
  });
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
