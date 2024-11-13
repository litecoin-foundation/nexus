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

export const getDayHistoricalRates = (): AppThunk => async dispatch => {
  const date = new Date();
  const lastDay = new Date();
  lastDay.setDate(lastDay.getDate() - 1);

  const lastDayUnix = Math.floor(lastDay / 1000);
  const dateUnix = Math.floor(date / 1000);

  try {
    const res = await fetch(
      `https://api.coinbase.com/api/v3/brokerage/market/products/LTC-USD/candles?start=${lastDayUnix}&end=${dateUnix}&granularity=FIVE_MINUTE&limit=350`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      const {message} = await res.json();
      console.error(message);
    }

    const data = await res.json();
    const {candles} = data;

    const result = candles.map(candle => [
      Number(candle.start),
      Number(candle.low),
      Number(candle.high),
      Number(candle.open),
      Number(candle.close),
      Number(candle.volume),
    ]);

    dispatch(updateHistoricRateDayAction(result));
  } catch (error) {
    console.error(error);
  }
};

// export const getWeekHistoricalRates = () => async dispatch => {
//   const date = new Date();
//   const lastWeek = new Date();
//   lastWeek.setDate(lastWeek.getDate() - 7);

//   try {
//     const res = await fetch(
//       'https://api.pro.coinbase.com/products/LTC-USD/candles',
//       {
//         method: 'GET',
//         headers: {
//           Accept: 'application/json',
//           'Content-Type': 'application/json',
//         },
//         params: {
//           start: lastWeek.toISOString(),
//           end: date.toISOString(),
//           granularity: 3600,
//         },
//       },
//     );

//     if (!res.ok) {
//       const {message} = await res.json();
//       console.error(message);
//     }

//     const data = await res.json();

//     dispatch({
//       type: UPDATE_HISTORIC_RATE_WEEK,
//       data,
//     });
//   } catch (error) {
//     console.error(error);
//   }
// };

// export const getMonthHistoricalRates = () => async dispatch => {
//   const date = new Date();
//   const lastMonth = new Date();
//   lastMonth.setMonth(lastMonth.getMonth() - 1);

//   try {
//     const res = await fetch(
//       'https://api.pro.coinbase.com/products/LTC-USD/candles',
//       {
//         method: 'GET',
//         headers: {
//           Accept: 'application/json',
//           'Content-Type': 'application/json',
//         },
//         params: {
//           start: lastMonth.toISOString(),
//           end: date.toISOString(),
//           granularity: 21600,
//         },
//       },
//     );

//     if (!res.ok) {
//       const {message} = await res.json();
//       console.error(message);
//     }

//     const data = await res.json();

//     dispatch({
//       type: UPDATE_HISTORIC_RATE_MONTH,
//       data,
//     });
//   } catch (error) {
//     console.error(error);
//   }
// };

export const updateHistoricalRates = (): AppThunk => (dispatch, getStore) => {
  const graphPeriod = getStore().chart.graphPeriod;

  switch (graphPeriod) {
    case '1D':
      dispatch(getDayHistoricalRates());
      break;
    case '1W':
      // dispatch(getWeekHistoricalRates());
      break;
    case '1M':
      // dispatch(getMonthHistoricalRates());
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
  (graphPeriod, dayData, weekData, monthData) => {
    let data;

    if (graphPeriod === '1D') {
      data = dayData;
    } else if (graphPeriod === '1W') {
      data = weekData;
    } else if (graphPeriod === '1M') {
      data = monthData;
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
