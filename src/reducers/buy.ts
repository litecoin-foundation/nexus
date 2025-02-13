import {createAction, createSlice} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {getLocales, getCountry} from 'react-native-localize';
import {uuidFromSeed} from '../lib/utils/uuid';

const MOONPAY_PUBLIC_KEY = 'pk_live_wnYzNcex8iKfXSUVwn4FoHDiJlX312';
const ONRAMPER_PUBLIC_KEY = 'pk_prod_01JHSS4GEJSTQD0Z56P5BDJSC6';

// types
interface IBuy {
  isMoonpayCustomer: boolean;
  quote: any;
  buyHistory: any[];
  sellHistory: any[];
  isBuyAllowed: boolean | null;
  isSellAllowed: boolean | null;
  minBuyAmount: number;
  maxBuyAmount: number;
  minLTCBuyAmount: number;
  maxLTCBuyAmount: number;
}

interface IQuote {}

// initial state
const initialState = {
  isMoonpayCustomer: true,
  quote: null,
  buyHistory: [],
  sellHistory: [],
  isBuyAllowed: null,
  isSellAllowed: null,
  minBuyAmount: 0,
  maxBuyAmount: 0,
  minLTCBuyAmount: 0,
  maxLTCBuyAmount: 0,
} as IBuy;

// actions
const getBuyTxHistoryAction = createAction('buy/getBuyTxHistoryAction');
const getSellTxHistoryAction = createAction('buy/getSellTxHistoryAction');
const getBuyQuoteAction = createAction('buy/getBuyQuoteAction');
const checkAllowedAction = createAction<{
  isBuyAllowed: boolean;
  isSellAllowed: boolean;
}>('buy/checkAllowedAction');
const getLimitsAction = createAction('buy/getLimitsAction');
const setMoonpayCustomer = createAction<boolean>('buy/setMoonpayCustomer');

// functions
export const getBuyTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;

    try {
      const res = await fetch(
        'https://mobile.litecoin.com/api/buy/moonpay/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            id: uniqueId,
          }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error);
      }

      const data = await res.json();

      dispatch(getBuyTxHistoryAction(data));
    } catch (error) {
      console.error(error);
    }
  };

export const getSellTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;

    const res = await fetch(
      'https://mobile.litecoin.com/api/sell/moonpay/transactions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uniqueId,
        }),
      },
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error);
    }

    const data = await res.json();

    dispatch(getSellTxHistoryAction(data));
  };

export const getBuyQuoteData = (
  currencyCode: string,
  cryptoAmount?: number,
  fiatAmount?: number,
) => {
  return new Promise(async (resolve, reject) => {
    const currencyAmountURL = fiatAmount
      ? `&baseCurrencyAmount=${fiatAmount}`
      : `&quoteCurrencyAmount=${cryptoAmount}`;
    const url =
      'https://api.moonpay.io/v3/currencies/ltc/quote/' +
      `?apiKey=${MOONPAY_PUBLIC_KEY}` +
      currencyAmountURL +
      `&baseCurrencyCode=${String(currencyCode).toLowerCase()}` +
      '&paymentMethod=credit_debit_card';

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        reject(error);
      }

      const data = await res.json();
      resolve(data);
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const getBuyQuote =
  (cryptoAmount?: number, fiatAmount?: number): AppThunk =>
  async (dispatch, getState) => {
    const {currencyCode} = getState().settings;
    const quote: any = await getBuyQuoteData(
      currencyCode,
      cryptoAmount,
      fiatAmount,
    );

    dispatch(getBuyQuoteAction(quote));
  };

export const getSellQuoteData = (
  currencyCode: string,
  cryptoAmount: number,
) => {
  return new Promise(async (resolve, reject) => {
    const url =
      'https://api.moonpay.com/v3/currencies/ltc/sell_quote/' +
      `?apiKey=${MOONPAY_PUBLIC_KEY}` +
      `&baseCurrencyAmount=${cryptoAmount}` +
      `&quoteCurrencyCode=${String(currencyCode).toLowerCase()}` +
      '&paymentMethod=credit_debit_card';

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        reject(error);
      }

      const data = await res.json();
      resolve(data);
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const getSellQuote =
  (cryptoAmount: number): AppThunk =>
  async (dispatch, getState) => {
    const {currencyCode} = getState().settings;
    const quote: any = await getSellQuoteData(currencyCode, cryptoAmount);

    // dispatch(getSellQuoteAction(quote));
  };

export const checkMoonpayCountry = (): AppThunk => dispatch => {
  const countryCode = getCountry();

  const moonpayCountries = [
    // eurozone
    'BE',
    'DE',
    'EE',
    'IE',
    'EL',
    'ES',
    'FR',
    'HR',
    'IT',
    'CY',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'AT',
    'PT',
    'SI',
    'SK',
    'FI',
    // uk & usa
    'GB',
    'US',
  ];

  if (moonpayCountries.includes(countryCode)) {
    dispatch(setMoonpayCustomer(true));
  } else {
    dispatch(setMoonpayCustomer(false));
  }
};

export const checkAllowed = (): AppThunk => async dispatch => {
  const ipCheckURL = `https://api.moonpay.com/v3/ip_address?apiKey=${MOONPAY_PUBLIC_KEY}`;
  const supportedCountriesURL = 'https://api.moonpay.com/v3/countries';

  let canBuyIP: boolean;
  let canSellIP: boolean;
  let canBuyCC: boolean;
  let canSellCC: boolean;

  const req = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  try {
    // check if buy/sell is allowed based on user ip
    const res = await fetch(ipCheckURL, req);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error);
    }

    const ipResponse = await res.json();
    const {isBuyAllowed, isSellAllowed} = ipResponse;
    canBuyIP = isBuyAllowed;
    canSellIP = isSellAllowed;

    // check if buy/sell is allowed based on device country config
    const {countryCode} = getLocales()[0];

    const res2 = await fetch(supportedCountriesURL, req);
    if (!res2.ok) {
      const error = await res2.json();
      throw new Error(error);
    }
    const data = await res2.json();

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
  const url = `https://api.moonpay.com/v3/currencies/ltc/limits?apiKey=${MOONPAY_PUBLIC_KEY}&baseCurrencyCode=${currencyCode}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error);
    }

    const data = await res.json();

    dispatch(getLimitsAction(data));
  } catch (error) {
    console.error(error);
  }
};

export const getOnramperUrl =
  (address: string, fiatAmount: number): AppThunk =>
  (dispatch, getState) => {
    const {currencyCode} = getState().settings;
    const {uniqueId} = getState().onboarding;
    const uniqueIdAsUUID = uuidFromSeed(uniqueId);

    const url =
      `https://buy.onramper.com/?apiKey=${ONRAMPER_PUBLIC_KEY}` +
      '&onlyCryptos=ltc_litecoin' +
      `&wallets=${address}` +
      `&defaultAmount=${fiatAmount}` +
      `&defaultFiat=${currencyCode}` +
      `&uuid=${uniqueIdAsUUID}` +
      'mode=buy';

    return url;
  };

export const getSignedUrl =
  (address: string, fiatAmount: number): AppThunk =>
  (_, getState) => {
    return new Promise(async (resolve, reject) => {
      const {currencyCode} = getState().settings;
      const {uniqueId} = getState().onboarding;
      const unsignedURL =
        `https://buy.moonpay.com?apiKey=${MOONPAY_PUBLIC_KEY}` +
        '&currencyCode=ltc' +
        `&externalCustomerId=${uniqueId}` +
        `&walletAddress=${address}` +
        `&baseCurrencyAmount=${fiatAmount}` +
        `&baseCurrencyCode=${String(currencyCode).toLowerCase()}`;

      try {
        const res = await fetch(
          'https://mobile.litecoin.com/api/buy/moonpay/sign',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({unsignedURL}),
          },
        );

        if (!res.ok) {
          const {message} = await res.json();
          reject(String(message));
        }

        const response = await res.json();
        const {urlWithSignature} = response;
        resolve(urlWithSignature);
      } catch (error) {
        // handle error
        reject(error);
      }
    });
  };

export const getSignedSellUrl =
  (address: string, ltcAmount: number): AppThunk =>
  (dispatch, getState) => {
    return new Promise(async (resolve, reject) => {
      const {uniqueId} = getState().onboarding;
      const unsignedURL =
        `https://sell.moonpay.com/?apiKey=${MOONPAY_PUBLIC_KEY}` +
        '&baseCurrencyCode=ltc' +
        `&baseCurrencyAmount=${ltcAmount}` +
        `&externalCustomerId=${uniqueId}` +
        `&refundWalletAddress=${address}` +
        '&redirectURL=https%3A%2F%2Fapi.nexuswallet.com%2Fmoonpay%2Fsuccess_sell%2F&mpSdk=%7B%22version%22%3A%221.0.3%22%2C%22environment%22%3A%22production%22%2C%22flow%22%3A%22sell%22%2C%22variant%22%3A%22webview%22%2C%22platform%22%3A%22rn%22%7D';

      try {
        const req = await fetch(
          'https://mobile.litecoin.com/api/sell/moonpay/sign',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              unsignedURL: unsignedURL,
            }),
          },
        );

        if (!req.ok) {
          const error = await req.text();
          throw new Error(error);
        }

        const data = await req.json();
        const {urlWithSignature} = data;
        resolve(urlWithSignature);
      } catch (error) {
        reject(error);
      }
    });
  };

// slice
export const buySlice = createSlice({
  name: 'buy',
  initialState,
  reducers: {
    getBuyTxHistoryAction: (state, action) => ({
      ...state,
      buyHistory: action.payload,
    }),
    getSellTxHistoryAction: (state, action) => ({
      ...state,
      sellHistory: action.payload,
    }),
    getBuyQuoteAction: (state, action) => ({
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
      minLTCBuyAmount: action.payload.quoteCurrency.minBuyAmount,
      maxLTCBuyAmount: action.payload.quoteCurrency.maxBuyAmount,
    }),
    setMoonpayCustomer: (state, action) => ({
      ...state,
      isMoonpayCustomer: action.payload,
    }),
  },
});

export default buySlice.reducer;
