import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {walletBalance} from 'react-native-turbo-lnd';

import {AppThunk} from './types';
import {poll} from '../lib/utils/poll';

// types
interface IBalanceState {
  totalBalance: string;
  confirmedBalance: string;
  unconfirmedBalance: string;
  lockedBalance: string;
  reservedBalanceAnchorChan: string;
}

// initial state
const initialState = {
  totalBalance: '',
  confirmedBalance: '',
  unconfirmedBalance: '',
  lockedBalance: '',
  reservedBalanceAnchorChan: '',
} as IBalanceState;

// actions
const getBalanceAction = createAction<IBalanceState>(
  'balance/getBalanceAction',
);

// functions
export const getBalance = (): AppThunk => async dispatch => {
  try {
    const walletBalanceResponse = await walletBalance({});

    const {
      confirmedBalance,
      unconfirmedBalance,
      lockedBalance,
      reservedBalanceAnchorChan,
      totalBalance,
    } = walletBalanceResponse;

    dispatch(
      getBalanceAction({
        confirmedBalance: String(confirmedBalance),
        unconfirmedBalance: String(unconfirmedBalance),
        lockedBalance: String(lockedBalance),
        reservedBalanceAnchorChan: String(reservedBalanceAnchorChan),
        totalBalance: String(totalBalance),
      }),
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
    getBalanceAction: (state, action: PayloadAction<IBalanceState>) => ({
      ...state,
      totalBalance: action.payload.totalBalance,
      confirmedBalance: action.payload.confirmedBalance,
      unconfirmedBalance: action.payload.unconfirmedBalance,
      lockedBalance: action.payload.lockedBalance,
      reservedBalanceAnchorChan: action.payload.reservedBalanceAnchorChan,
    }),
  },
});

export default balanceSlice.reducer;
