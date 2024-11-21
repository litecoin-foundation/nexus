import {createAction, createSlice, createSelector} from '@reduxjs/toolkit';
import axios from 'axios';
import memoize from 'lodash.memoize';

import {poll} from '../lib/utils/poll';
import {AppThunk} from './types';

// types
interface ITicker {}

// initial state
const initialState = {
  paymentRate: null,
  rates: [],
  day: [],
  week: [],
  month: [],
  quarter: [],
  year: [],
  all: [],
} as ITicker;

// actions
const getPaymentRateAction = createAction('ticker/getPaymentRateAction');
const getTickerAction = createAction('ticker/getTickerAction');
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

const publishableKey = 'pk_live_oh73eavK2ZIRR7wxHjWD7HrkWk2nlSr';

// functions
export const getPaymentRate = (): AppThunk => async (dispatch, getState) => {
  const {currencyCode} = getState().settings;
  const url =
    'https://api.moonpay.io/v3/currencies/ltc/quote/' +
    `?apiKey=${publishableKey}` +
    '&baseCurrencyAmount=1' +
    `&baseCurrencyCode=${String(currencyCode).toLowerCase()}` +
    '&paymentMethod=credit_debit_card';

  try {
    const {data} = await axios.get(url);
    let paymentRate = data.quoteCurrencyPrice;

    dispatch(getPaymentRateAction(paymentRate));
  } catch (error) {
    console.log(error);
  }
};

export const getTicker = (): AppThunk => async dispatch => {
  const {
    data: {data: {rates} = {}},
  } = await axios.get(
    'https://api.coinbase.com/v2/exchange-rates?currency=LTC',
  );

  dispatch(getTickerAction(rates));
};

export const pollPaymentRate = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getPaymentRate()), 15000);
};

export const pollTicker = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getTicker()), 15000);
};

const fetchHistoricalRates = async (interval: string): Promise<any[]> => {
  const url = `https://mobile.litecoin.com/api/prices/${interval}`;
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

// slice
export const tickerSlice = createSlice({
  name: 'ticker',
  initialState,
  reducers: {
    getPaymentRateAction: (state, action) => ({
      ...state,
      paymentRate: action.payload,
    }),
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
  },
});

// selectors
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
