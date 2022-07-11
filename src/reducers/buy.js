import axios from 'axios';

// initial state
const initialState = {
  quote: null,
  history: [],
};

// constants
const GET_QUOTE = 'GET_QUOTE';
const GET_TRANSACTION_HISTORY = 'GET_TRANSACTION_HISTORY';

const publishableKey = 'pk_live_oh73eavK2ZIRR7wxHjWD7HrkWk2nlSr';

// actions
export const getTransactionHistory = () => async (dispatch, getState) => {
  const {uniqueId} = getState().onboarding;
  const response = await axios.post(
    'https://lndmobile.loshan.co.uk/api/buy/moonpay/transactions',
    {
      id: uniqueId,
    },
  );

  dispatch({
    type: GET_TRANSACTION_HISTORY,
    history: response.data,
  });
};

export const getQuote = () => async (dispatch, getState) => {
  const {fiatAmount} = getState().input;
  const {amount} = getState().input;
  const {currencyCode} = getState().settings;
  const url =
    'https://api.moonpay.io/v3/currencies/ltc/quote/' +
    `?apiKey=${publishableKey}` +
    `&quoteCurrencyAmount=${amount}` +
    `&baseCurrencyCode=${String(currencyCode).toLowerCase()}` +
    '&paymentMethod=credit_debit_card';

  try {
    const {data} = await axios.get(url);
    dispatch({
      type: GET_QUOTE,
      quote: data,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSignedUrl = async (address, fiatAmount, id) => {
  const url =
    `https://buy.moonpay.io?apiKey=${publishableKey}` +
    '&currencyCode=ltc' +
    `&externalCustomerId=${id}` +
    `&walletAddress=${address}` +
    `&baseCurrencyAmount=${fiatAmount}`;

  const {data} = await axios.post(
    'https://lndmobile.loshan.co.uk/api/buy/moonpay/sign',
    {
      url,
    },
  );

  return data;
};

// action handlers
const actionHandler = {
  [GET_QUOTE]: (state, {quote}) => ({...state, quote}),
  [GET_TRANSACTION_HISTORY]: (state, {history}) => ({...state, history}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
