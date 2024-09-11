import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';

import {AppThunk} from './types';
import * as Lnd from '../lib/lightning/onchain';
import {poll} from '../lib/utils/poll';

// types
interface IBalanceState {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
  balance: number;
  pendingOpenBalance: number;
}

type GetBalanceType = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

// initial state
const initialState = {
  totalBalance: 0,
  confirmedBalance: 0,
  unconfirmedBalance: 0,
  balance: 0,
  pendingOpenBalance: 0,
} as IBalanceState;

// actions
const getBalanceAction = createAction<GetBalanceType>(
  'balance/getBalanceAction',
);

// functions
export const getBalance = (): AppThunk => async dispatch => {
  try {
    const {totalBalance, confirmedBalance, unconfirmedBalance} =
      await Lnd.walletBalance();

    dispatch(
      getBalanceAction({totalBalance, confirmedBalance, unconfirmedBalance}),
    );
  } catch (error) {
    console.error(error);
  }
};

export const pollBalance = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getBalance()));
};

// slicer
export const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    getBalanceAction: (state, action: PayloadAction<GetBalanceType>) => ({
      ...state,
      totalBalance: action.payload.totalBalance,
      confirmedBalance: action.payload.confirmedBalance,
      unconfirmedBalance: action.payload.unconfirmedBalance,
    }),
  },
});

export default balanceSlice.reducer;
