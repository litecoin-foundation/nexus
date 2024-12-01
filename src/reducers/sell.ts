import {createAction, createSlice} from '@reduxjs/toolkit';
import {AppThunk} from './types';

// types
interface ISell {
  history: string[];
}

// initial state
const initialState = {
  history: [],
} as ISell;

// actions
const getTxHistoryAction = createAction('sell/getTxHistoryAction');

// functions
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

    const {data} = await res.json();

    dispatch(getTxHistoryAction(data));
  };

// slice
export const sellSlice = createSlice({
  name: 'sell',
  initialState,
  reducers: {
    getTxHistoryAction: (state, action) => ({
      ...state,
      history: action.payload,
    }),
  },
});

export default sellSlice.reducer;
