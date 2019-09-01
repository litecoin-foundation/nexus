import axios from 'axios';
import {sleep} from '../lib/utils';

// initial state
const initialState = {
  rates: [],
};

// constants
export const GET_TICKER = 'GET_TICKER';

// actions
export const getTicker = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const {
      data: {data: {rates} = {}},
    } = await axios.get(
      'https://api.coinbase.com/v2/exchange-rates?currency=LTC',
    );
    dispatch({
      type: GET_TICKER,
      rates,
    });
    await sleep();
  }
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
