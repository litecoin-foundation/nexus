import axios from 'axios';
import {poll} from '../lib/utils/poll';

// initial state
const initialState = {
  rates: [],
};

// constants
export const GET_TICKER = 'GET_TICKER';

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

// action handlers
const actionHandler = {
  [GET_TICKER]: (state, {rates}) => ({...state, rates}),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
