import {createAction, createSlice} from '@reduxjs/toolkit';
import axios from 'axios';
import {AppThunk} from './types';
import {getLocales} from 'react-native-localize';

const publishableKey = 'pk_test_RPbBRvEyfEh2h5KOKPwRhwDlwokr4Nv';

// types
interface IBuy {
  quote: 'string' | null;
  history: string[];
  isBuyAllowed: boolean | null;
  isSellAllowed: boolean | null;
  minBuyAmount: number;
  maxBuyAmount: number;
}

// initial state
const initialState = {
  quote: null,
  history: [],
  isBuyAllowed: null,
  isSellAllowed: null,
  minBuyAmount: 0,
  maxBuyAmount: 0,
} as IBuy;

// actions
const getTxHistoryAction = createAction('buy/getTxHistoryAction');
const getQuoteAction = createAction('buy/getQuoteAction');
const checkAllowedAction = createAction<{
  isBuyAllowed: boolean;
  isSellAllowed: boolean;
}>('buy/checkAllowedAction');
const getLimitsAction = createAction('buy/getLimitsAction');

// functions
export const getTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;
    const {data} = await axios.post(
      'https://lndmobile.loshan.co.uk/api/buy/moonpay/transactions',
      {
        id: uniqueId,
      },
    );

    dispatch(getTxHistoryAction(data));
  };

export const getQuote =
  (cryptoAmount: number): AppThunk =>
  async (dispatch, getState) => {
    const {currencyCode} = getState().settings;
    const url =
      'https://api.moonpay.io/v3/currencies/ltc/quote/' +
      `?apiKey=${publishableKey}` +
      `&quoteCurrencyAmount=${cryptoAmount}` +
      `&baseCurrencyCode=${String(currencyCode).toLowerCase()}` +
      '&paymentMethod=credit_debit_card';

    console.log(url);

    try {
      const {data} = await axios.get(url);
      dispatch(getQuoteAction(data));
    } catch (error: any) {
      console.error(error.response.data.message);
    }
  };

export const checkAllowed = (): AppThunk => async dispatch => {
  const ipCheckURL = `https://api.moonpay.com/v3/ip_address?apiKey=${publishableKey}`;
  const supportedCountriesURL = 'https://api.moonpay.com/v3/countries';

  let canBuyIP: boolean;
  let canSellIP: boolean;
  let canBuyCC: boolean;
  let canSellCC: boolean;

  try {
    // check if buy/sell is allowed based on user ip
    const ipResponse = (await axios.get(ipCheckURL)).data;
    const {isBuyAllowed, isSellAllowed} = ipResponse;
    canBuyIP = isBuyAllowed;
    canSellIP = isSellAllowed;

    // check if buy/sell is allowed based on device country config
    const {countryCode} = getLocales()[0];
    const {data} = await axios.get(supportedCountriesURL);

    const country = data.find((c: any) => c.alpha2 === countryCode);
    if (!country) {
      // country alpha2 does not exist in moonpay's supported list
      canBuyCC = false;
      canSellCC = false;
    }

    canBuyCC = country.isBuyAllowed;
    canSellCC = country.isSellAllowed;

    // only allow if both country check and ip check are positive
    dispatch(
      checkAllowedAction({
        isBuyAllowed: canBuyCC && canBuyIP,
        isSellAllowed: canSellCC && canSellIP,
      }),
    );

    // TODO: handle US state level blocking
  } catch (error) {
    console.error(error);
  }
};

export const getLimits = (): AppThunk => async (dispatch, getState) => {
  const {currencyCode} = getState().settings;
  const url = `https://api.moonpay.com/v3/currencies/ltc/limits?apiKey=${publishableKey}&baseCurrencyCode=${currencyCode}`;

  try {
    const {data} = await axios.get(url);

    dispatch(getLimitsAction(data));
  } catch (error) {
    console.error(error);
  }
};

export const getSignedUrl = async (
  address: string,
  fiatAmount: number,
  id: string,
) => {
  const unsignedURL =
    `https://buy-sandbox.moonpay.com?apiKey=${publishableKey}` +
    '&currencyCode=ltc' +
    `&externalCustomerId=${id}` +
    `&walletAddress=${address}` +
    `&baseCurrencyAmount=${fiatAmount}`;

  try {
    const res = await fetch('http://192.168.1.60:3001/api/buy/moonpay/sign', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({unsignedURL}),
    });

    if (!res.ok) {
      const {message} = await res.json();
      return Error(message);
    }

    const signature = await res.json();
    return `${unsignedURL}&signature=${encodeURIComponent(signature)}`;
  } catch (error) {
    // handle error
    console.error(error);
  }
};

// slice
export const buySlice = createSlice({
  name: 'buy',
  initialState,
  reducers: {
    getTxHistoryAction: (state, action) => ({
      ...state,
      history: action.payload,
    }),
    getQuoteAction: (state, action) => ({
      ...state,
      quote: action.payload,
    }),
    checkAllowedAction: (state, action) => ({
      ...state,
      isBuyAllowed: action.payload.isBuyAllowed,
      isSellAllowed: action.payload.isSellAllowed,
    }),
    getLimitsAction: (state, action) => ({
      ...state,
      minBuyAmount: action.payload.baseCurrency.minBuyAmount,
      maxBuyAmount: action.payload.baseCurrency.maxBuyAmount,
    }),
  },
});

export default buySlice.reducer;
