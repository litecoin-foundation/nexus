import axios from 'axios';
import {createSelector} from 'reselect';

import {poll} from '../lib/utils/poll';

// initial state
const initialState = {
  rates: [],
  month: [],
};

// constants
export const GET_TICKER = 'GET_TICKER';
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
  await poll(() => dispatch(getTicker()));
};

export const getHistoricalRates = () => async dispatch => {
  const date = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // month request
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

// action handlers
const actionHandler = {
  [GET_TICKER]: (state, {rates}) => ({...state, rates}),
  [UPDATE_HISTORIC_RATE_MONTH]: (state, {data}) => ({
    ...state,
    month: data,
  }),
};

// selectors
export const rateSelector = state => state.ticker.rates;

export const monthSelector = createSelector(
  state => state.ticker.month,
  monthData => {
    const result = monthData.map(data => {
      return {
        x: new Date(data[0] * 1000),
        y: data[3],
      };
    });

    // sort array by date (old -> new)
    // by default Coinbase API returns new -> old
    result.sort(function(a, b) {
      return new Date(a.x) - new Date(b.x);
    });

    return result;
  },
);

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
