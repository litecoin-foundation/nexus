import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppThunk} from './types';
import {getCountry} from 'react-native-localize';
import {uuidFromSeed} from '../lib/utils/uuid';
import {
  IBuyQuote,
  ISellQuote,
  IBuyLimits,
  ISellLimits,
  IBuyQuoteAndLimits,
  ISellQuoteAndLimits,
  getMoonpayBuyQuoteDataUrl,
  getMoonpaySellQuoteDataUrl,
  emptyBuyQuoteAndLimits,
  emptySellQuoteAndLimits,
} from '../utils/tradeQuotes';
import {ITrade} from '../utils/txMetadata';

const MOONPAY_PUBLIC_KEY = 'pk_live_wnYzNcex8iKfXSUVwn4FoHDiJlX312';
const ONRAMPER_PUBLIC_KEY = 'pk_prod_01JHSS4GEJSTQD0Z56P5BDJSC6';
const ONRAMPER_TEST_PUBLIC_KEY = 'pk_test_01JF0BA1P5AXVTW3NQM22FJXG2';

// types
interface IBuy {
  isMoonpayCustomer: boolean;
  isOnramperCustomer: boolean;
  isFlexaCustomer: boolean;
  buyQuote: IBuyQuote;
  sellQuote: ISellQuote;
  buyHistory: any[];
  sellHistory: any[];
  isBuyAllowed: boolean | null;
  isSellAllowed: boolean | null;
  buyLimits: IBuyLimits;
  sellLimits: ISellLimits;
  proceedToGetBuyLimits: boolean;
  proceedToGetSellLimits: boolean;
}

// initial state
const initialState = {
  isMoonpayCustomer: true,
  isOnramperCustomer: true,
  isFlexaCustomer: false,
  buyQuote: {
    ltcAmount: 0,
    ltcPrice: 0,
    totalAmount: 0,
    baseCurrencyAmount: 0,
    networkFeeAmount: 0,
    feeAmount: 0,
    discount: 0,
  },
  sellQuote: {
    ltcAmount: 0,
    ltcPrice: 0,
    totalAmount: 0,
    fiatAmount: 0,
    networkFeeAmount: 0,
    feeAmount: 0,
  },
  buyHistory: [],
  sellHistory: [],
  isBuyAllowed: null,
  isSellAllowed: null,
  buyLimits: {
    minBuyAmount: 0,
    maxBuyAmount: 0,
    minLTCBuyAmount: 0,
    maxLTCBuyAmount: 0,
  },
  sellLimits: {
    minLTCSellAmount: 0,
    maxLTCSellAmount: 0,
  },
  proceedToGetBuyLimits: false,
  proceedToGetSellLimits: false,
} as IBuy;

// actions
const setMoonpayCustomer = createAction<boolean>('buy/setMoonpayCustomer');
const setOnramperCustomer = createAction<boolean>('buy/setOnramperCustomer');
const setFlexaCustomer = createAction<boolean>('buy/setFlexaCustomer');
const setBuyQuoteAction = createAction<IBuyQuote>('buy/setBuyQuoteAction');
// const setSellQuoteAction = createAction<ISellQuote>('buy/setSellQuoteAction');
const getBuyTxHistoryAction = createAction('buy/getBuyTxHistoryAction');
const getSellTxHistoryAction = createAction('buy/getSellTxHistoryAction');
const checkAllowedAction = createAction<{
  isBuyAllowed: boolean;
  isSellAllowed: boolean;
}>('buy/checkAllowedAction');
const setBuyLimitsAction = createAction<IBuyLimits>('buy/setBuyLimitsAction');
const setSellLimitsAction = createAction<ISellLimits>(
  'buy/setSellLimitsAction',
);
const setProceedToGetLimitsAction = createAction<{
  proceedToGetBuyLimits: boolean;
  proceedToGetSellLimits: boolean;
}>('buy/setProceedToGetLimitsAction');

// functions
export const getBuyTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;

    try {
      const res = await fetch('https://api.nexuswallet.com/api/trades/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          userAppUniqueId: uniqueId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error);
      }

      const data: ITrade[] = await res.json();
      let realTxs: any = [];

      // filter out prompted but yet unknown txs and failed txs
      // NOTE: unknown transaction is used in nexus-api to identify
      // clients of payment providers
      if (data && data.length > 0) {
        realTxs = data.filter(
          (tx: ITrade) =>
            tx.providerTxId !== 'unknown' && tx.status !== 'failed',
        );
      }

      dispatch(getBuyTxHistoryAction(realTxs));
    } catch (error) {
      console.error(error);
    }
  };

export const getSellTransactionHistory =
  (): AppThunk => async (dispatch, getState) => {
    const {uniqueId} = getState().onboarding;

    const res = await fetch('https://api.nexuswallet.com/api/trades/sell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAppUniqueId: uniqueId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error);
    }

    const data: ITrade[] = await res.json();
    let realTxs: any = [];

    // filter out prompted but yet unknown txs and failed txs
    // NOTE: unknown transaction is used in nexus-api to identify
    // clients of payment providers
    if (data && data.length > 0) {
      realTxs = data.filter(
        (tx: ITrade) => tx.providerTxId !== 'unknown' && tx.status !== 'failed',
      );
    }

    dispatch(getSellTxHistoryAction(realTxs));
  };

export const checkFlexaCustomer =
  (): AppThunk => async (dispatch, getState) => {
    const {testPaymentActive, testPaymentCountry} = getState().settings;
    const countryCode = testPaymentActive ? testPaymentCountry : getCountry();
    let isFlexaCustomer = false;
    switch (countryCode) {
      case 'US':
      case 'CA':
      case 'SV':
        isFlexaCustomer = true;
        break;
      default:
        isFlexaCustomer = false;
        break;
    }
    dispatch(setFlexaCustomer(isFlexaCustomer));
  };

const getMoonpayBuyQuoteData = (
  currencyCode: string,
  cryptoAmount?: number,
  fiatAmount?: number,
) => {
  return new Promise<IBuyQuoteAndLimits>(async (resolve, reject) => {
    const url = getMoonpayBuyQuoteDataUrl(
      currencyCode,
      cryptoAmount,
      fiatAmount,
    );

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
        if (isNaN(+Number(data.quoteCurrencyPrice))) {
          resolve(emptyBuyQuoteAndLimits);
        } else {
          // parentheses are crucial
          const combinedFee =
            (data.feeAmount || 0) + (data.extraFeeAmount || 0);
          resolve({
            ltcAmount: data.quoteCurrencyAmount || 0,
            ltcPrice: data.quoteCurrencyPrice || 0,
            totalAmount: data.totalAmount || 0,
            baseCurrencyAmount: data.baseCurrencyAmount || 0,
            networkFeeAmount: data.networkFeeAmount || 0,
            feeAmount: combinedFee,
            discount: data.feeAmountDiscount || 0,
            // buyLimits for Moonpay are set by getMoonpayLimits
            buyLimits: null,
          });
        }
      } else {
        resolve(emptyBuyQuoteAndLimits);
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
  return new Promise<IBuyQuoteAndLimits>(async (resolve, reject) => {
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

      // resolve(null);
      resolve(emptyBuyQuoteAndLimits);
    } catch (error: any) {
      reject(error);
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
  return new Promise<IBuyQuoteAndLimits>(async resolve => {
    let quote: IBuyQuoteAndLimits = {
      ltcAmount: 0,
      ltcPrice: 0,
      totalAmount: 0,
      baseCurrencyAmount: 0,
      networkFeeAmount: 0,
      feeAmount: 0,
      discount: 0,
      buyLimits: null,
    };

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
      // Instead of rejecting we reset quotes to indicate
      // that it's not fetched while not breaking math
      resolve(emptyBuyQuoteAndLimits);
    }
  });
};

export const setBuyQuote =
  (cryptoAmount?: number, fiatAmount?: number): AppThunk =>
  async (dispatch, getState) => {
    const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;
    const {testPaymentActive, testPaymentCountry, testPaymentFiat} =
      getState().settings;

    const currencyCode = testPaymentActive
      ? testPaymentFiat
      : getState().settings.currencyCode;
    const countryCode = testPaymentActive ? testPaymentCountry : getCountry();

    let quote: any = await getBuyQuote(
      isMoonpayCustomer,
      isOnramperCustomer,
      currencyCode,
      cryptoAmount,
      fiatAmount,
      countryCode,
    );

    // if quote does return limits update proceedToGetBuyLimits notification boolean
    dispatch(
      setProceedToGetLimitsAction({
        proceedToGetBuyLimits: quote.buyLimits
          ? false
          : getState().buy.proceedToGetBuyLimits,
        proceedToGetSellLimits: getState().buy.proceedToGetSellLimits,
      }),
    );

    // set sell limits if available
    if (quote.buyLimits) {
      dispatch(setBuyLimitsAction(quote.buyLimits));
    }

    // set quote
    dispatch(setBuyQuoteAction(quote));
  };

const getMoonpaySellQuoteData = (
  currencyCode: string,
  cryptoAmount: number,
) => {
  return new Promise<ISellQuoteAndLimits>(async (resolve, reject) => {
    const url = getMoonpaySellQuoteDataUrl(cryptoAmount, currencyCode);

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
        // set sell limits
        const ltcSellLimits = data.hasOwnProperty('baseCurrency')
          ? {
              minLTCSellAmount: data.baseCurrency.minSellAmount as number,
              maxLTCSellAmount: data.baseCurrency.maxSellAmount as number,
            }
          : {minLTCSellAmount: 0, maxLTCSellAmount: 0};

        // check if response is number
        if (isNaN(+Number(data.quoteCurrencyAmount))) {
          resolve(emptySellQuoteAndLimits);
        } else {
          resolve({
            ltcAmount: data.baseCurrencyAmount || 0,
            ltcPrice: data.quoteCurrencyAmount || 0,
            totalAmount: data.baseCurrencyPrice || 0,
            fiatAmount: data.quoteCurrencyAmount || 0,
            networkFeeAmount: data.networkFeeAmount || 0,
            feeAmount: data.feeAmount || 0,
            sellLimits: ltcSellLimits,
          });
        }
      } else {
        resolve(emptySellQuoteAndLimits);
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
  return new Promise<ISellQuoteAndLimits>(async resolve => {
    let quote: ISellQuoteAndLimits = {
      ltcAmount: 0,
      ltcPrice: 0,
      totalAmount: 0,
      fiatAmount: 0,
      networkFeeAmount: 0,
      feeAmount: 0,
      sellLimits: null,
    };

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
      // Instead of rejecting we reset quotes to indicate
      // that it's not fetched while not breaking math
      resolve(emptySellQuoteAndLimits);
    }
  });
};

export const setSellQuote =
  (cryptoAmount: number): AppThunk =>
  async (dispatch, getState) => {
    return new Promise<ISellQuoteAndLimits>(async resolve => {
      const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;
      const {testPaymentActive, testPaymentCountry, testPaymentFiat} =
        getState().settings;

      const currencyCode = testPaymentActive
        ? testPaymentFiat
        : getState().settings.currencyCode;
      const countryCode = testPaymentActive ? testPaymentCountry : getCountry();

      const quote: ISellQuoteAndLimits = await getSellQuote(
        isMoonpayCustomer,
        isOnramperCustomer,
        currencyCode,
        cryptoAmount,
        countryCode,
      );

      // if quote does return limits update proceedToGetSellLimits notification boolean
      dispatch(
        setProceedToGetLimitsAction({
          proceedToGetBuyLimits: getState().buy.proceedToGetBuyLimits,
          proceedToGetSellLimits: quote.sellLimits
            ? false
            : getState().buy.proceedToGetSellLimits,
        }),
      );

      // set sell limits if available
      if (quote.sellLimits) {
        dispatch(setSellLimitsAction(quote.sellLimits));
      }

      // set quote
      // NOTE: effectively we never need to set see quote state since
      // we never show quote preview for user, all we need is ltc amount
      // user wants to sell which is set by input handle
      // dispatch(setSellQuoteAction(quote));

      resolve(quote);
    });
  };

export const checkBuySellProviderCountry =
  (): AppThunk => (dispatch, getState) => {
    const {testPaymentActive, testPaymentCountry, testPaymentMethod} =
      getState().settings;

    const countryCode = testPaymentActive ? testPaymentCountry : getCountry();

    if (testPaymentActive) {
      const isMoonpay = testPaymentMethod === 'MOONPAY';
      const isOnramper = testPaymentMethod === 'ONRAMPER';

      dispatch(setMoonpayCustomer(isMoonpay));
      dispatch(setOnramperCustomer(isOnramper));
      return;
    }

    const isMoonpay = moonpayCountries.includes(countryCode);
    const isOnramper = onramperCountries.includes(countryCode);

    dispatch(setMoonpayCustomer(isMoonpay));
    dispatch(setOnramperCustomer(isOnramper));
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

const checkMoonpayAllowed = (): AppThunk => async (dispatch, getState) => {
  const {testPaymentActive, testPaymentCountry} = getState().settings;

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
    const countryCode = testPaymentActive ? testPaymentCountry : getCountry();

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
  const {
    testPaymentActive,
    testPaymentKey,
    testPaymentCountry,
    testPaymentFiat,
  } = getState().settings;

  // check if buy/sell is allowed based on user ip and preferred currency
  const currencyCode = testPaymentActive
    ? testPaymentFiat
    : getState().settings.currencyCode;
  const countryCode = testPaymentActive ? testPaymentCountry : getCountry();

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

  // ONRAMPER_TEST_PUBLIC_KEY returns forbidden res
  // const req = {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     accept: 'application/json',
  //     Authorization:
  //       testPaymentActive && testPaymentKey
  //         ? ONRAMPER_TEST_PUBLIC_KEY
  //         : ONRAMPER_PUBLIC_KEY,
  //   },
  // };

  try {
    const res = await fetch(supportedForBuying, req);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
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
      throw new Error(error.message);
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
  const {testPaymentActive, testPaymentFiat} = getState().settings;

  const currencyCode = testPaymentActive
    ? testPaymentFiat
    : getState().settings.currencyCode;

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

    // set limits when possible
    const buyLimits = {
      minBuyAmount: data.baseCurrency.minBuyAmount,
      maxBuyAmount: data.baseCurrency.maxBuyAmount,
      minLTCBuyAmount: data.quoteCurrency.minBuyAmount,
      maxLTCBuyAmount: data.quoteCurrency.maxBuyAmount,
    };
    dispatch(setBuyLimitsAction(buyLimits));

    // set proceedToGetLimits if there's no buy/sell general limits
    // NOTE: limits can be set after getting a quote
    // for getMoonpayLimits sell limits are set on setSellQuote request
    dispatch(
      setProceedToGetLimitsAction({
        proceedToGetBuyLimits: false,
        proceedToGetSellLimits: getState().buy.proceedToGetSellLimits,
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

const getOnramperLimits = (): AppThunk => async dispatch => {
  // set limits when possible
  // TODO: get actual limits when it's working on onramper's end
  // const buyLimits = {
  //   minBuyAmount: 10,
  //   maxBuyAmount: 10000,
  //   minLTCBuyAmount: 0.1,
  //   maxLTCBuyAmount: 100,
  // };
  // dispatch(setBuyLimitsAction(buyLimits));
  // const sellLimits = {
  //   minLTCSellAmount: 0.01,
  //   maxLTCSellAmount: 999,
  // };
  // dispatch(setSellLimitsAction(sellLimits));

  // set proceedToGetLimits if there's no general limits
  // NOTE: limits can be set after getting a quote
  dispatch(
    setProceedToGetLimitsAction({
      proceedToGetBuyLimits: true,
      proceedToGetSellLimits: true,
    }),
  );
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
      const {testPaymentActive, testPaymentFiat} = getState().settings;

      const currencyCode = testPaymentActive
        ? testPaymentFiat
        : getState().settings.currencyCode;

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
      const {testPaymentActive, testPaymentKey, testPaymentFiat} =
        getState().settings;

      const currencyCode = testPaymentActive
        ? testPaymentFiat
        : getState().settings.currencyCode;

      const {uniqueId} = getState().onboarding;
      const uniqueIdAsUUID = uuidFromSeed(uniqueId);

      const signContent = `wallets=ltc_litecoin:${address}`;
      const onramperKey =
        testPaymentActive && testPaymentKey
          ? ONRAMPER_TEST_PUBLIC_KEY
          : ONRAMPER_PUBLIC_KEY;
      const baseUrl =
        testPaymentActive && testPaymentKey
          ? `https://buy.onramper.dev/?apiKey=${onramperKey}`
          : `https://buy.onramper.com/?apiKey=${onramperKey}`;

      const unsignedURL =
        baseUrl +
        '&onlyCryptos=ltc_litecoin' +
        `&wallets=ltc_litecoin:${address}` +
        `&defaultAmount=${fiatAmount}` +
        `&defaultFiat=${currencyCode}` +
        `&uuid=${uniqueIdAsUUID}` +
        `&partnerContext=${uniqueId}` +
        '&mode=buy' +
        '&successRedirectUrl=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fbuy%2Fonramper%2Fsuccess_buy%2F';

      try {
        const res = await fetch(
          testPaymentActive && testPaymentKey
            ? 'https://api.nexuswallet.com/api/buy/onramper/sign_test'
            : 'https://api.nexuswallet.com/api/buy/onramper/sign',
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
      const {testPaymentActive, testPaymentKey, testPaymentFiat} =
        getState().settings;

      const currencyCode = testPaymentActive
        ? testPaymentFiat
        : getState().settings.currencyCode;

      const {uniqueId} = getState().onboarding;
      const uniqueIdAsUUID = uuidFromSeed(uniqueId);

      const signContent = `wallets=ltc_litecoin:${address}`;
      const onramperKey =
        testPaymentActive && testPaymentKey
          ? ONRAMPER_TEST_PUBLIC_KEY
          : ONRAMPER_PUBLIC_KEY;
      const baseUrl =
        testPaymentActive && testPaymentKey
          ? `https://buy.onramper.dev/?apiKey=${onramperKey}`
          : `https://buy.onramper.com/?apiKey=${onramperKey}`;

      const unsignedURL =
        baseUrl +
        '&sell_onlyCryptos=ltc_litecoin' +
        `&sell_defaultFiat=${currencyCode}` +
        '&sell_defaultCrypto=ltc_litecoin' +
        `&sell_defaultAmount=${cryptoAmount}` +
        `&uuid=${uniqueIdAsUUID}` +
        `&partnerContext=${uniqueId}` +
        '&mode=sell' +
        '&offrampCashoutRedirectUrl=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fsell%2Fonramper%2Fsuccess_sell%2F' +
        '&successRedirectUrl=https%3A%2F%2Fapi.nexuswallet.com%2Fapi%2Fsell%2Fonramper%2Fsuccess_sell_complete%2F';

      try {
        const res = await fetch(
          testPaymentActive && testPaymentKey
            ? 'https://api.nexuswallet.com/api/buy/onramper/sign_test'
            : 'https://api.nexuswallet.com/api/buy/onramper/sign',
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
    setBuyQuoteAction: (state, action) => ({
      ...state,
      buyQuote: action.payload,
    }),
    setSellQuoteAction: (state, action) => ({
      ...state,
      sellQuote: action.payload,
    }),
    checkAllowedAction: (state, action) => ({
      ...state,
      isBuyAllowed: action.payload.isBuyAllowed,
      isSellAllowed: action.payload.isSellAllowed,
    }),
    setBuyLimitsAction: (state, action) => ({
      ...state,
      buyLimits: action.payload,
    }),
    setSellLimitsAction: (state, action) => ({
      ...state,
      sellLimits: action.payload,
    }),
    setProceedToGetLimitsAction: (state, action) => ({
      ...state,
      proceedToGetBuyLimits: action.payload.proceedToGetBuyLimits,
      proceedToGetSellLimits: action.payload.proceedToGetSellLimits,
    }),
    setMoonpayCustomer: (state, action) => ({
      ...state,
      isMoonpayCustomer: action.payload,
    }),
    setOnramperCustomer: (state, action) => ({
      ...state,
      isOnramperCustomer: action.payload,
    }),
    setFlexaCustomer: (state, action) => ({
      ...state,
      isFlexaCustomer: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default buySlice.reducer;

export const moonpayCountries = [
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

export const onramperCountries = [
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
