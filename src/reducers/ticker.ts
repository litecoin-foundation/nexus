import {createAction, createSlice, createSelector} from '@reduxjs/toolkit';
import memoize from 'lodash.memoize';

import {poll} from '../lib/utils/poll';
import {AppThunk} from './types';
import {getBuyQuote, getSellQuoteData, setSellLimits} from './buy';

// types
type IRates = {
  [key: string]: string;
};

interface ITicker {
  ltcRate: number;
  buyRate: number;
  sellRate: number;
}

// initial state
const initialState = {
  ltcRate: 0,
  buyRate: 0,
  sellRate: 0,
  rates: [],
  day: [],
  week: [],
  month: [],
  quarter: [],
  year: [],
  all: [],
} as ITicker;

// actions
const getTickerAction = createAction<IRates>('ticker/getTickerAction');
const updateRatesAction = createAction<{
  buy: number;
  sell: number;
  ltc: number;
}>('ticker/updateRatesAction');
const updateHistoricRateDayAction = createAction(
  'ticker/updateHistoricRateDayAction',
);
const updateHistoricRateWeekAction = createAction(
  'ticker/updateHistoricRateWeekAction',
);
const updateHistoricRateMonthAction = createAction(
  'ticker/updateHistoricRateMonthAction',
);
const updateHistoricRateQuarterAction = createAction(
  'ticker/updateHistoricRateQuarterAction',
);
const updateHistoricRateYearAction = createAction(
  'ticker/updateHistoricRateYearAction',
);
const updateHistoricRateAllAction = createAction(
  'ticker/updateHistoricRateAllAction',
);

// functions

const getTickerData = () => {
  return new Promise<{[key: string]: string}>(async (resolve, reject) => {
    try {
      const res = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=LTC',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (!res.ok) {
        const error = await res.json();
        reject(error);
      }

      const {
        data: {rates},
      } = await res.json();

      resolve(rates);
    } catch (error) {
      reject(error);
    }
  });
};

export const pollRates = (): AppThunk => async (dispatch, getState) => {
  await poll(async () => {
    const {isMoonpayCustomer, isOnramperCustomer} = getState().buy;
    const {currencyCode} = getState().settings;

    try {
      // fetch buy quote
      const buyQuote: any = await getBuyQuote(
        isMoonpayCustomer,
        isOnramperCustomer,
        currencyCode,
        1,
      );
      // const buy = Number(buyQuote.quoteCurrencyPrice);
      let buy = Number(buyQuote);
      // if quote is null/0 there was a fetching error
      // set coinbase rate instead
      if (!buy) {
        buy = getState().ticker.ltcRate;
      }

      // fetch sell quote
      // const sellQuote: any = await getSellQuoteData(currencyCode, 1);
      // const sell = Number(sellQuote.baseCurrencyPrice);
      const sell = 10;

      // fetch ltc rates
      const rates = await getTickerData();
      const ltc = Number(rates[currencyCode]);
      dispatch(getTickerAction(rates));

      // console.log('ticker buy quote - ' + buy);
      // console.log('ticker sell quote - ' + sell);
      // console.log('ticker ltc rate - ' + ltc);
      dispatch(updateRatesAction({buy, sell, ltc}));

      // set Sell Limits
      // const {minSellAmount, maxSellAmount} = sellQuote.baseCurrency;
      const {minSellAmount, maxSellAmount} = {
        minSellAmount: 0.1,
        maxSellAmount: 100,
      };
      dispatch(setSellLimits(Number(minSellAmount), Number(maxSellAmount)));
    } catch (error) {
      console.warn(error);
    }
  }, 15000);
};

const fetchHistoricalRates = async (interval: string): Promise<any[]> => {
  const url = `https://api.nexuswallet.com/api/prices/${interval}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {method: 'GET', headers});

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch historical rates');
  }

  const {data} = await res.json();

  return data;
};

export const updatedRatesInFiat = (): AppThunk => async dispatch => {
  try {
    const rates = await getTickerData();
    dispatch(getTickerAction(rates));
  } catch (error) {
    console.error('Error fetching day historical rates:', error);
  }
};

export const getDayHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('1D');
    dispatch(updateHistoricRateDayAction(result));
  } catch (error) {
    console.error('Error fetching day historical rates:', error);
  }
};

export const getWeekHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('1W');
    dispatch(updateHistoricRateWeekAction(result));
  } catch (error) {
    console.error('Error fetching week historical rates:', error);
  }
};

export const getMonthHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('1M');
    dispatch(updateHistoricRateMonthAction(result));
  } catch (error) {
    console.error('Error fetching month historical rates:', error);
  }
};

export const getQuarterHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('3M');
    dispatch(updateHistoricRateQuarterAction(result));
  } catch (error) {
    console.error('Error fetching 3-month historical rates:', error);
  }
};

export const getYearHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('1Y');
    dispatch(updateHistoricRateYearAction(result));
  } catch (error) {
    console.error('Error fetching 1-year historical rates:', error);
  }
};

export const getAllHistoricalRates = (): AppThunk => async dispatch => {
  try {
    const result = await fetchHistoricalRates('ALL');
    dispatch(updateHistoricRateAllAction(result));
  } catch (error) {
    console.error('Error fetching All historical rates:', error);
  }
};

export const updateHistoricalRates = (): AppThunk => (dispatch, getStore) => {
  const graphPeriod = getStore().chart.graphPeriod;

  switch (graphPeriod) {
    case '1D':
      dispatch(getDayHistoricalRates());
      break;
    case '1W':
      dispatch(getWeekHistoricalRates());
      break;
    case '1M':
      dispatch(getMonthHistoricalRates());
      break;
    case '3M':
      dispatch(getQuarterHistoricalRates());
      break;
    case '1Y':
      dispatch(getYearHistoricalRates());
      break;
    case 'ALL':
      dispatch(getAllHistoricalRates());
      break;
    default:
      dispatch(getDayHistoricalRates());
      break;
  }
};

export const updateHistoricalRatesForAllPeriods =
  (): AppThunk => async dispatch => {
    let result = await fetchHistoricalRates('1D');
    dispatch(updateHistoricRateDayAction(result));
    result = await fetchHistoricalRates('1W');
    dispatch(updateHistoricRateWeekAction(result));
    result = await fetchHistoricalRates('1M');
    dispatch(updateHistoricRateMonthAction(result));
    result = await fetchHistoricalRates('3M');
    dispatch(updateHistoricRateQuarterAction(result));
    result = await fetchHistoricalRates('1Y');
    dispatch(updateHistoricRateYearAction(result));
    result = await fetchHistoricalRates('ALL');
    dispatch(updateHistoricRateAllAction(result));
  };

// slice
export const tickerSlice = createSlice({
  name: 'ticker',
  initialState,
  reducers: {
    getTickerAction: (state, action) => ({
      ...state,
      rates: action.payload,
    }),
    updateHistoricRateDayAction: (state, action) => ({
      ...state,
      day: action.payload,
    }),
    updateHistoricRateWeekAction: (state, action) => ({
      ...state,
      week: action.payload,
    }),
    updateHistoricRateMonthAction: (state, action) => ({
      ...state,
      month: action.payload,
    }),
    updateHistoricRateQuarterAction: (state, action) => ({
      ...state,
      quarter: action.payload,
    }),
    updateHistoricRateYearAction: (state, action) => ({
      ...state,
      year: action.payload,
    }),
    updateHistoricRateAllAction: (state, action) => ({
      ...state,
      all: action.payload,
    }),
    updateRatesAction: (state, action) => ({
      ...state,
      ltcRate: action.payload.ltc,
      buyRate: action.payload.buy,
      sellRate: action.payload.sell,
    }),
  },
});

// selectors
export const ltcRateSelector = createSelector(
  state => state.ticker.rates,
  state => state.settings.currencyCode,
  (rates, currencyCode) => {
    if (rates[currencyCode] === undefined) {
      return rates.USD;
    } else {
      return rates[currencyCode];
    }
  },
);

export const convertLocalFiatToUSD = createSelector(
  state => state.settings.currencyCode,
  state => state.ticker.rates,
  (currencyCode: string, rates) => {
    const localToUSD = rates.USD / rates[currencyCode];
    return localToUSD;
  },
);

export const fiatValueSelector = createSelector(
  state => state.ticker.rates,
  state => state.settings.currencyCode,
  state => state.settings.currencySymbol,
  (rates, currencyCode, currencySymbol) =>
    memoize(
      satoshi =>
        `${currencySymbol}${(
          (satoshi / 100000000) *
          rates[currencyCode]
        ).toFixed(2)}`,
    ),
);

export const monthSelector = createSelector(
  state => state.chart.graphPeriod,
  state => state.ticker.day,
  state => state.ticker.week,
  state => state.ticker.month,
  state => state.ticker.quarter,
  state => state.ticker.year,
  state => state.ticker.all,
  (
    graphPeriod,
    dayData,
    weekData,
    monthData,
    quarterData,
    yearData,
    allData,
  ) => {
    let data;

    if (graphPeriod === '1D') {
      data = dayData;
    } else if (graphPeriod === '1W') {
      data = weekData;
    } else if (graphPeriod === '1M') {
      data = monthData;
    } else if (graphPeriod === '3M') {
      data = quarterData;
    } else if (graphPeriod === '1Y') {
      data = yearData;
    } else if (graphPeriod === 'ALL') {
      data = allData;
    }

    if (data === undefined || data === null) {
      return;
    }

    const result = data.map(data => {
      return {
        x: new Date(data[0] * 1000),
        y: data[3],
      };
    });

    // sort array by date (old -> new)
    // by default Coinbase API returns new -> old
    result.sort(function (a, b) {
      return new Date(a.x) - new Date(b.x);
    });

    return result;
  },
);

export default tickerSlice.reducer;
