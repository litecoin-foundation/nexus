import axios from 'axios';
import {createSelector} from 'reselect';
import memoize from 'lodash.memoize';

import {poll} from '../lib/utils/poll';

// initial state
const initialState = {
  rates: [],
  day: [],
  week: [],
  month: [],
};

// constants
export const GET_TICKER = 'GET_TICKER';
export const UPDATE_HISTORIC_RATE_DAY = 'UPDATE_HISTORIC_RATE_DAY';
export const UPDATE_HISTORIC_RATE_WEEK = 'UPDATE_HISTORIC_RATE_WEEK';
export const UPDATE_HISTORIC_RATE_MONTH = 'UPDATE_HISTORIC_RATE_MONTH';

// actions
export const getTicker = () => async dispatch => {
  const {
    data: {data: {rates} = {}},
  } = await axios.get(
    'https://api.coinbase.com/v2/exchange-rates?currency=LTC',
  );
  dispatch({
    type: GET_TICKER,
    rates,
  });
};

export const pollTicker = () => async dispatch => {
  await poll(() => dispatch(getTicker()), 15000);
};

export const getDayHistoricalRates = () => async dispatch => {
  const date = new Date();
  const lastDay = new Date();
  lastDay.setDate(lastDay.getDate() - 1);

  const {data} = await axios.get(
    'https://api.pro.coinbase.com/products/LTC-USD/candles',
    {
      params: {
        start: lastDay.toISOString(),
        end: date.toISOString(),
        granularity: 300,
      },
    },
  );

  dispatch({
    type: UPDATE_HISTORIC_RATE_DAY,
    data,
  });
};

export const getWeekHistoricalRates = () => async dispatch => {
  const date = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const {data} = await axios.get(
    'https://api.pro.coinbase.com/products/LTC-USD/candles',
    {
      params: {
        start: lastWeek.toISOString(),
        end: date.toISOString(),
        granularity: 3600,
      },
    },
  );

  dispatch({
    type: UPDATE_HISTORIC_RATE_WEEK,
    data,
  });
};

export const getMonthHistoricalRates = () => async dispatch => {
  const date = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const {data} = await axios.get(
    'https://api.pro.coinbase.com/products/LTC-USD/candles',
    {
      params: {
        start: lastMonth.toISOString(),
        end: date.toISOString(),
        granularity: 21600,
      },
    },
  );

  dispatch({
    type: UPDATE_HISTORIC_RATE_MONTH,
    data,
  });
};

export const updateHistoricalRates = () => (dispatch, getStore) => {
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
    default:
      dispatch(getDayHistoricalRates());
      break;
  }
};

// action handlers
const actionHandler = {
  [GET_TICKER]: (state, {rates}) => ({...state, rates}),
  [UPDATE_HISTORIC_RATE_DAY]: (state, {data}) => ({
    ...state,
    day: data,
  }),
  [UPDATE_HISTORIC_RATE_WEEK]: (state, {data}) => ({
    ...state,
    week: data,
  }),
  [UPDATE_HISTORIC_RATE_MONTH]: (state, {data}) => ({
    ...state,
    month: data,
  }),
};

// selectors
export const fiatValueSelector = createSelector(
  state => state.ticker.rates,
  rates => memoize(satoshi => ((satoshi / 100000000) * rates.USD).toFixed(2)),
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

    if (data === undefined) {
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

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
