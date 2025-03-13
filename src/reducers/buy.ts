import {createAction, createSlice} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {getLocales, getCountry} from 'react-native-localize';
import {uuidFromSeed} from '../lib/utils/uuid';

const enableTest = false;
const TEST_METHOD: string = 'ONRAMPER';
const TEST_COUNTRY: string = 'NL';
const TEST_FIAT: string = 'EUR';

const MOONPAY_PUBLIC_KEY = 'pk_live_wnYzNcex8iKfXSUVwn4FoHDiJlX312';
const ONRAMPER_PUBLIC_KEY = enableTest
  ? 'pk_test_01JF0BA1P5AXVTW3NQM22FJXG2'
  : 'pk_prod_01JHSS4GEJSTQD0Z56P5BDJSC6';

// types
interface IBuy {
  isMoonpayCustomer: boolean;
  isOnramperCustomer: boolean;
  quote: any;
  buyHistory: any[];
  sellHistory: any[];
  isBuyAllowed: boolean | null;
  isSellAllowed: boolean | null;
  minBuyAmount: number;
  maxBuyAmount: number;
  minLTCBuyAmount: number;
  maxLTCBuyAmount: number;
  minLTCSellAmount: number;
  maxLTCSellAmount: number;
}

interface IQuote {}

// initial state
const initialState = {
  isMoonpayCustomer: true,
  isOnramperCustomer: true,
  quote: null,
  buyHistory: [],
  sellHistory: [],
  isBuyAllowed: null,
  isSellAllowed: null,
  minBuyAmount: 0,
  maxBuyAmount: 0,
  minLTCBuyAmount: 0,
  maxLTCBuyAmount: 0,
  minLTCSellAmount: 0,
  maxLTCSellAmount: 0,
} as IBuy;

// actions
const getBuyTxHistoryAction = createAction('buy/getBuyTxHistoryAction');
const getSellTxHistoryAction = createAction('buy/getSellTxHistoryAction');
const setQuoteAction = createAction('buy/setQuoteAction');
const checkAllowedAction = createAction<{
  isBuyAllowed: boolean;
  isSellAllowed: boolean;
}>('buy/checkAllowedAction');
const setLimitsAction = createAction<{
  minBuyAmount: number;
  maxBuyAmount: number;
  minLTCBuyAmount: number;
  maxLTCBuyAmount: number;
}>('buy/setLimitsAction');
const setBuyLimitsAction = createAction<{
  minBuyAmount: number;
  maxBuyAmount: number;
}>('buy/setBuyLimitsAction');
const setSellLimitsAction = createAction<{
  minSellAmount: number;
  maxSellAmount: number;
}>('buy/setSellLimitsAction');
const setMoonpayCustomer = createAction<boolean>('buy/setMoonpayCustomer');
const setOnramperCustomer = createAction<boolean>('buy/setOnramperCustomer');

// functions
export const getBuyTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;

    try {
      const res = await fetch(
        'https://api.nexuswallet.com/api/buy/moonpay/transactions',
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
        console.log(error);
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
      'https://api.nexuswallet.com/api/sell/moonpay/transactions',
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

const getMoonpayBuyQuoteData = (
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

      if (data && data.hasOwnProperty('quoteCurrencyPrice')) {
        // check if response is number
        // return sell quote 0 if it's not
        if (isNaN(+Number(data.quoteCurrencyPrice))) {
          resolve(0);
        } else {
          resolve(data.quoteCurrencyPrice);
        }
      } else {
        resolve(0);
      }
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

const getOnramperBuyQuoteData = (
  currencyCode: string,
  cryptoAmount?: number,
  fiatAmount?: number,
  countryCode?: string,
) => {
  return new Promise(async (resolve, reject) => {
    // TODO: uncomment and test when it's working on onramper's end
    // const countryCodeUrl = countryCode ? `?country=${countryCode}` : '';
    // const url =
    //   `https://api.onramper.com/quotes/${currencyCode}/ltc_litecoin` +
    //   `?amount=${cryptoAmount}` +
    //   countryCodeUrl;

    try {
      // const res = await fetch(url, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     accept: 'application/json',
      //     Authorization: ONRAMPER_PUBLIC_KEY,
      //   },
      // });

      // if (!res.ok) {
      //   const error = await res.json();
      //   reject(error);
      // }

      // const data = await res.json();
      // resolve(data);

      resolve(null);
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const getBuyQuote = (
  isMoonpayCustomer: boolean,
  isOnramperCustomer: boolean,
  currencyCode: string,
  cryptoAmount?: number,
  fiatAmount?: number,
  countryCode?: string,
) => {
  return new Promise(async (resolve, reject) => {
    let quote: any;

    try {
      if (isMoonpayCustomer) {
        quote = await getMoonpayBuyQuoteData(
          currencyCode,
          cryptoAmount,
          fiatAmount,
        );
      } else if (isOnramperCustomer) {
        quote = await getOnramperBuyQuoteData(
          currencyCode,
          cryptoAmount,
          fiatAmount,
          countryCode,
        );
      }

      resolve(quote);
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const setBuyQuote =
  (cryptoAmount?: number, fiatAmount?: number): AppThunk =>
  async (dispatch, getState) => {
    const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;

    const currencyCode = enableTest
      ? TEST_FIAT
      : getState().settings.currencyCode;
    const countryCode = enableTest ? TEST_COUNTRY : getCountry();

    let quote: any = await getBuyQuote(
      isMoonpayCustomer,
      isOnramperCustomer,
      currencyCode,
      cryptoAmount,
      fiatAmount,
      countryCode,
    );

    // if quote is null/undefined/0 there was a fetching error
    // set coinbase rate instead
    if (!quote) {
      quote = getState().ticker.ltcRate;
    }

    // set sell limits when possible
    const {minSellAmount, maxSellAmount} = quote.baseCurrency;
    dispatch(setSellLimitsAction({minSellAmount, maxSellAmount}));

    dispatch(setQuoteAction(quote));
  };

export const getMoonpaySellQuoteData = (
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

      if (data && data.hasOwnProperty('quoteCurrencyAmount')) {
        // check if response is number
        // return sell quote 0 if it's not
        if (isNaN(+Number(data.quoteCurrencyAmount))) {
          resolve(0);
        } else {
          resolve(data.quoteCurrencyAmount);
        }
      } else {
        resolve(0);
      }
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const getSellQuote = (
  isMoonpayCustomer: boolean,
  isOnramperCustomer: boolean,
  currencyCode: string,
  cryptoAmount: number,
  countryCode?: string,
) => {
  return new Promise(async (resolve, reject) => {
    let quote: any;

    try {
      if (isMoonpayCustomer) {
        quote = await getMoonpaySellQuoteData(currencyCode, cryptoAmount);
      } else if (isOnramperCustomer) {
        // not supported by onramper
        // quote = await getOnramperSellQuoteData(
        //   currencyCode,
        //   cryptoAmount,
        //   countryCode,
        // );
      }

      resolve(quote);
    } catch (error: any) {
      reject(error.response.data.message);
    }
  });
};

export const setSellQuote =
  (cryptoAmount: number): AppThunk =>
  async (dispatch, getState) => {
    const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;

    const currencyCode = enableTest
      ? TEST_FIAT
      : getState().settings.currencyCode;
    const countryCode = enableTest ? TEST_COUNTRY : getCountry();

    let quote: any = await getSellQuote(
      isMoonpayCustomer,
      isOnramperCustomer,
      currencyCode,
      cryptoAmount,
      countryCode,
    );

    // if quote is null/undefined/0 there was a fetching error
    // set coinbase rate instead
    if (!quote) {
      quote = getState().ticker.ltcRate;
    }

    dispatch(setQuoteAction(quote));
  };

export const checkBuySellProviderCountry = (): AppThunk => dispatch => {
  const countryCode = enableTest ? TEST_COUNTRY : getCountry();

  if (enableTest) {
    if (TEST_METHOD === 'MOONPAY') {
      dispatch(setMoonpayCustomer(true));
      dispatch(setOnramperCustomer(false));
    } else if (TEST_METHOD === 'ONRAMPER') {
      dispatch(setMoonpayCustomer(false));
      dispatch(setOnramperCustomer(true));
    } else {
      dispatch(setMoonpayCustomer(false));
      dispatch(setOnramperCustomer(false));
    }
  } else {
    if (moonpayCountries.includes(countryCode)) {
      dispatch(setMoonpayCustomer(true));
    } else {
      dispatch(setMoonpayCustomer(false));

      if (onramperCountries.includes(countryCode)) {
        dispatch(setOnramperCustomer(true));
      } else {
        dispatch(setOnramperCustomer(false));
      }
    }
  }
};

export const checkAllowed = (): AppThunk => async (dispatch, getState) => {
  const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;

  if (isMoonpayCustomer) {
    dispatch(checkMoonpayAllowed());
  } else if (isOnramperCustomer) {
    dispatch(checkOnramperAllowed());
  } else {
    return;
  }
};

const checkMoonpayAllowed = (): AppThunk => async dispatch => {
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

const checkOnramperAllowed = (): AppThunk => async (dispatch, getState) => {
  // check if buy/sell is allowed based on user ip and preferred currency
  const currencyCode = enableTest
    ? TEST_FIAT
    : getState().settings.currencyCode;
  const countryCode = enableTest ? TEST_COUNTRY : getCountry();

  // ltc_litecoin code
  const supportedForBuying = `https://api.onramper.com/supported/assets?source=${currencyCode}&type=buy&country=${countryCode}`;
  const supportedForSelling = `https://api.onramper.com/supported/assets?source=ltc_litecoin&type=sell&country=${countryCode}`;

  let canBuy: boolean = false;
  let canSell: boolean = false;

  const req = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      Authorization: ONRAMPER_PUBLIC_KEY,
    },
  };

  try {
    const res = await fetch(supportedForBuying, req);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error);
    }
    const data = await res.json();
    if (data.hasOwnProperty('message')) {
      if (data.message.hasOwnProperty('assets')) {
        if (data.message.assets[0].crypto.includes('ltc_litecoin')) {
          canBuy = true;
        }
      }
    }
    const res2 = await fetch(supportedForSelling, req);
    if (!res2.ok) {
      const error = await res2.json();
      throw new Error(error);
    }
    const data2 = await res2.json();
    if (data2.hasOwnProperty('message')) {
      if (data2.message.hasOwnProperty('assets')) {
        if (data2.message.assets[0].fiat.includes(currencyCode.toLowerCase())) {
          canSell = true;
        }
      }
    }
    dispatch(
      checkAllowedAction({
        isBuyAllowed: canBuy,
        isSellAllowed: canSell,
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

const getMoonpayLimits = (): AppThunk => async (dispatch, getState) => {
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

    dispatch(
      setLimitsAction({
        minBuyAmount: data.baseCurrency.minBuyAmount,
        maxBuyAmount: data.baseCurrency.maxBuyAmount,
        minLTCBuyAmount: data.quoteCurrency.minBuyAmount,
        maxLTCBuyAmount: data.quoteCurrency.maxBuyAmount,
      }),
    );

    // set sell limits when possible
    const {minSellAmount, maxSellAmount} = {
      minSellAmount: 0.1,
      maxSellAmount: 100,
    };
    dispatch(setSellLimitsAction({minSellAmount, maxSellAmount}));
  } catch (error) {
    console.error(error);
  }
};

const getOnramperLimits = (): AppThunk => async dispatch => {
  // TODO: get actual limits when it's working on onramper's end
  const data = {
    minBuyAmount: 10,
    maxBuyAmount: 10000,
    minLTCBuyAmount: 0.1,
    maxLTCBuyAmount: 100,
  };
  dispatch(setLimitsAction(data));

  // set sell limits when possible
  const {minSellAmount, maxSellAmount} = {
    minSellAmount: 0.1,
    maxSellAmount: 100,
  };
  dispatch(setSellLimitsAction({minSellAmount, maxSellAmount}));
};

export const setLimits = (): AppThunk => async (dispatch, getState) => {
  const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;

  if (isMoonpayCustomer) {
    dispatch(getMoonpayLimits());
  } else if (isOnramperCustomer) {
    dispatch(getOnramperLimits());
  } else {
    return;
  }
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
        `&baseCurrencyCode=${String(currencyCode).toLowerCase()}` +
        '&redirectURL=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fbuy%2Fmoonpay%2Fsuccess_buy%2F';

      try {
        const res = await fetch(
          'https://api.nexuswallet.com/api/buy/moonpay/sign',
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

export const getSignedOnramperUrl =
  (address: string, fiatAmount: number): AppThunk =>
  (_, getState) => {
    return new Promise(async (resolve, reject) => {
      const {currencyCode} = getState().settings;
      const {uniqueId} = getState().onboarding;
      const uniqueIdAsUUID = uuidFromSeed(uniqueId);

      const signContent = `wallets=ltc_litecoin:${address}`;
      const baseUrl = enableTest
        ? `https://buy.onramper.dev/?apiKey=${ONRAMPER_PUBLIC_KEY}`
        : `https://buy.onramper.com/?apiKey=${ONRAMPER_PUBLIC_KEY}`;

      const unsignedURL =
        baseUrl +
        '&onlyCryptos=ltc_litecoin' +
        `&wallets=ltc_litecoin:${address}` +
        `&defaultAmount=${fiatAmount}` +
        `&defaultFiat=${currencyCode}` +
        `&uuid=${uniqueIdAsUUID}` +
        '&mode=buy' +
        '&successRedirectUrl=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fbuy%2Fonramper%2Fsuccess_buy%2F';

      try {
        const res = await fetch(
          'https://api.nexuswallet.com/api/buy/onramper/sign',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({signContent: signContent}),
          },
        );

        if (!res.ok) {
          const {message} = await res.json();
          reject(String(message));
        }

        const response = await res.json();

        const signature = response;
        const signedUrl = `${unsignedURL}&signature=${signature}`;

        resolve(signedUrl);
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
        '&redirectURL=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fsell%2Fmoonpay%2Fsuccess_sell%2F&mpSdk=%7B%22version%22%3A%221.0.3%22%2C%22environment%22%3A%22production%22%2C%22flow%22%3A%22sell%22%2C%22variant%22%3A%22webview%22%2C%22platform%22%3A%22rn%22%7D';

      try {
        const req = await fetch(
          'https://api.nexuswallet.com/api/sell/moonpay/sign',
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

export const getSignedSellOnramperUrl =
  (address: string, cryptoAmount: number): AppThunk =>
  (_, getState) => {
    return new Promise(async (resolve, reject) => {
      const {currencyCode} = getState().settings;
      const {uniqueId} = getState().onboarding;
      const uniqueIdAsUUID = uuidFromSeed(uniqueId);

      const signContent = `wallets=ltc_litecoin:${address}`;
      const baseUrl = enableTest
        ? `https://buy.onramper.dev/?apiKey=${ONRAMPER_PUBLIC_KEY}`
        : `https://buy.onramper.com/?apiKey=${ONRAMPER_PUBLIC_KEY}`;

      const unsignedURL =
        baseUrl +
        '&sell_onlyCryptos=ltc_litecoin' +
        `&sell_defaultFiat=${currencyCode}` +
        '&sell_defaultCrypto=ltc_litecoin' +
        `&sell_defaultAmount=${cryptoAmount}` +
        `&uuid=${uniqueIdAsUUID}` +
        '&mode=sell' +
        '&successRedirectUrl=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fsell%2Fonramper%2Fsuccess_sell%2F';

      try {
        const res = await fetch(
          'https://api.nexuswallet.com/api/buy/onramper/sign',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({signContent: signContent}),
          },
        );

        if (!res.ok) {
          const {message} = await res.json();
          reject(String(message));
        }

        const response = await res.json();

        const signature = response;
        const signedUrl = `${unsignedURL}&signature=${signature}`;

        resolve(signedUrl);
      } catch (error) {
        // handle error
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
    setQuoteAction: (state, action) => ({
      ...state,
      quote: action.payload,
    }),
    checkAllowedAction: (state, action) => ({
      ...state,
      isBuyAllowed: action.payload.isBuyAllowed,
      isSellAllowed: action.payload.isSellAllowed,
    }),
    setLimitsAction: (state, action) => ({
      ...state,
      minBuyAmount: action.payload.minBuyAmount,
      maxBuyAmount: action.payload.maxBuyAmount,
      minLTCBuyAmount: action.payload.minBuyAmount,
      maxLTCBuyAmount: action.payload.maxBuyAmount,
    }),
    setBuyLimitsAction: (state, action) => ({
      ...state,
      minLTCBuyAmount: action.payload.minBuyAmount,
      maxLTCBuyAmount: action.payload.maxBuyAmount,
    }),
    setSellLimitsAction: (state, action) => ({
      ...state,
      minLTCSellAmount: action.payload.minSellAmount,
      maxLTCSellAmount: action.payload.maxSellAmount,
    }),
    setMoonpayCustomer: (state, action) => ({
      ...state,
      isMoonpayCustomer: action.payload,
    }),
    setOnramperCustomer: (state, action) => ({
      ...state,
      isOnramperCustomer: action.payload,
    }),
  },
});

export default buySlice.reducer;

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

const onramperCountries = [
  // North America (excluding usa)
  'CA',
  'MX',
  'BM',
  'GL',
  'PM',

  // Central America & Caribbean
  'BZ',
  'CR',
  'SV',
  'GT',
  'HN',
  'NI',
  'PA',
  'AG',
  'AI',
  'AW',
  'BB',
  'BL',
  'BQ',
  'BS',
  'CU',
  'CW',
  'DM',
  'DO',
  'GD',
  'GP',
  'HT',
  'JM',
  'KN',
  'KY',
  'LC',
  'MF',
  'MS',
  'PR',
  'TC',
  'TT',
  'VC',
  'VG',
  'VI',

  // South America
  'AR',
  'BO',
  'BR',
  'CL',
  'CO',
  'EC',
  'FK',
  'GF',
  'GY',
  'PE',
  'PY',
  'SR',
  'UY',
  'VE',

  // Europe (exlcuding eurozone + uk)
  'IS',
  'SJ',
  'AL',
  'CH',
  'UA',
  'SE',
  'BG',
  'RO',
  'FO',
  'AD',
  'JE',
  'GG',
  'MK',
  'LI',
  'PL',
  'XK',
  'MD',
  'CZ',
  'DK',
  'HU',
  'MC',
  'VA',
  'SM',
  'GI',
  'ME',
  'NO',
  'IM',

  // Africa
  'AO',
  'BJ',
  'BW',
  'BF',
  'BI',
  'CV',
  'CM',
  'CF',
  'TD',
  'KM',
  'CD',
  'DJ',
  'GQ',
  'ER',
  'SZ',
  'ET',
  'GA',
  'GM',
  'GH',
  'GN',
  'GW',
  'CI',
  'KE',
  'LS',
  'LR',
  'MG',
  'MW',
  'ML',
  'MR',
  'MU',
  'YT',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'ST',
  'SN',
  'SC',
  'SL',
  'SH',
  'TG',
  'TZ',
  'UG',
  'ZM',
  'ZW',

  // Asia
  'BH',
  'BD',
  'BN',
  'KH',
  'CN',
  'HK',
  'IN',
  'ID',
  'IL',
  'JP',
  'JO',
  'KZ',
  'KW',
  'KG',
  'LA',
  'LB',
  'MO',
  'MY',
  'MV',
  'MN',
  'MM',
  'NP',
  'OM',
  'PK',
  'PS',
  'PH',
  'QA',
  'SA',
  'SG',
  'KR',
  'LK',
  'SY',
  'TJ',
  'TH',
  'TL',
  'TM',
  'AE',
  'UZ',
  'VN',
  'YE',

  // Oceania
  'AS',
  'AU',
  'CX',
  'CC',
  'CK',
  'FJ',
  'GU',
  'KI',
  'MH',
  'FM',
  'NR',
  'NC',
  'NZ',
  'NU',
  'NF',
  'MP',
  'PW',
  'PG',
  'PN',
  'WS',
  'SB',
  'TK',
  'TO',
  'TV',
  'VU',
  'WF',

  // Antarctica & Outlying Territories
  'AQ',
];
