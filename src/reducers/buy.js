import axios from 'axios';
import {createSelector} from 'reselect';

// initial state
const initialState = {
  amount: '',
  quote_id: '',
  base_amount: '',
  total_amount: '',
  valid: '',
  order_id: '',
  user_id: '',
};

// constants
const SET_AMOUNT = 'SET_AMOUNT';
const GET_QUOTE = 'GET_QUOTE';
const RUN_KYC = 'RUN_KYC';

// actions
export const setAmount = amount => dispatch => {
  dispatch({
    type: SET_AMOUNT,
    amount,
  });
};

export const getQuote = () => async (dispatch, getState) => {
  const {amount} = getState().buy;

  const data = {
    end_user_id: 'PUT_SOMETHING_HERE',
    requested_amount: parseFloat(amount),
    fiat_currency: 'USD',
  };

  try {
    const response = await axios({
      url: 'https://api.loafwallet.org/api/buy/quote',
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      data,
    });

    const valid = new Date(response.data.valid_until);

    dispatch({
      type: GET_QUOTE,
      response,
      valid,
    });
  } catch (error) {
    console.log(error);
  }
};

export const runKYC = () => async (dispatch, getState) => {
  const {quote_id, total_amount, amount} = getState().buy;
  const data = {
    user_id: 'USER_ID_HERE',
    quote_id,
    payment_id: 'PAYMENT_ID_HERE',
    order_id: 'ORDER_ID_HERE',
    fiat_amount: total_amount,
    crypto_amount: amount,
    install_date: 'APP_INSTALL_DATE',
    currency_code: 'CURRENCY_CODE',
    address: 'LITECOIN_ADDRESS_HERE',
  };
  try {
    const response = await axios({
      url: 'https://api.loafwallet.org/api/buy/kyc',
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      data,
    });
  } catch (error) {
    console.log(error);
  }
};

// selectors
export const priceSelector = createSelector(
  state => state.buy.total_amount,
  state => state.buy.base_amount,
  state => state.buy.amount,
  (total, base, amount) => {
    const pricePerUnit = (total / parseFloat(amount)).toFixed(2);
    const fee = (total - base).toFixed(2);
    return {total, pricePerUnit, fee};
  },
);

// action handlers
const actionHandler = {
  [SET_AMOUNT]: (state, {amount}) => ({...state, amount}),
  [GET_QUOTE]: (state, {response, valid}) => ({
    ...state,
    quote_id: response.data.quote_id,
    base_amount: response.data.fiat_money.base_amount,
    total_amount: response.data.fiat_money.total_amount,
    valid,
  }),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
