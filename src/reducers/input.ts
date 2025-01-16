import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {satsToSubunit, subunitToSats} from '../lib/utils/satoshis';

// types
interface IInputState {
  amount: string;
  fiatAmount: string;
  send: {
    toAddress: string;
    label: string;
    amount: Number;
    fee: Number | null;
  };
}

type InputType = 'buy' | 'sell' | 'ltc';

// initial state
const initialState = {
  amount: '',
  fiatAmount: '',
  send: {
    toAddress: '',
    label: '',
    amount: 0,
    fee: null,
  },
} as IInputState;

// actions
const updateAmountAction = createAction<string>('input/updateAmountAction');
const updateFiatAmountAction = createAction<string>(
  'input/updateFiatAmountAction',
);
export const updateSendAmount = createAction<Number>('input/updateSendAmount');
export const updateSendAddress = createAction<string>(
  'input/updateSendAddress',
);
// const updateSendFeeAction = createAction<Number>('input/updateFeeAction');
export const resetInputs = createAction('input/resetInputs');

// functions
export const updateAmount =
  (amount: string, type: InputType): AppThunk =>
  dispatch => {
    dispatch(updateAmountAction(amount));
    dispatch(handleFiatConversion(amount, type));
  };

export const updateFiatAmount =
  (fiatAmount: string, type: InputType): AppThunk =>
  dispatch => {
    dispatch(updateFiatAmountAction(fiatAmount));
    dispatch(handleAmountConversion(fiatAmount, type));
  };

const handleFiatConversion =
  (amount: string, type: InputType): AppThunk =>
  (dispatch, getState) => {
    // subunit to sats
    // sats -> litecoin
    const subunit = getState().settings.subunit;
    const satoshis = subunitToSats(Number(amount), subunit);
    const litecoin = satoshis / 100000000;

    if (type === 'buy') {
      const rate = getState().ticker.buyRate;
      const fiatAmount = rate
        ? `${(parseFloat(amount) * rate).toFixed(2)}`
        : '0';
      dispatch(updateFiatAmountAction(fiatAmount));
    } else if (type === 'sell') {
      const rate = getState().ticker.sellRate;
      const fiatAmount = rate
        ? `${(parseFloat(amount) * rate).toFixed(2)}`
        : '0';
      dispatch(updateFiatAmountAction(fiatAmount));
    } else if (type === 'ltc') {
      const rate = getState().ticker.ltcRate;
      const fiatAmount = rate ? (litecoin * rate).toFixed(2) : '0';
      dispatch(updateFiatAmountAction(fiatAmount));
    }
  };

const handleAmountConversion =
  (fiatAmount: string, type: InputType): AppThunk =>
  (dispatch, getState) => {
    const subunit = getState().settings.subunit;
    if (type === 'buy') {
      const rate = getState().ticker.buyRate;
      const amount = rate
        ? `${(parseFloat(fiatAmount) / rate).toFixed(4)}`
        : '0';
      dispatch(updateAmountAction(amount));
    } else if (type === 'sell') {
      const rate = getState().ticker.sellRate;
      const amount = rate
        ? `${(parseFloat(fiatAmount) / rate).toFixed(4)}`
        : '0';
      dispatch(updateAmountAction(amount));
    } else if (type === 'ltc') {
      const rate = getState().ticker.ltcRate;
      const amount = rate ? parseFloat(fiatAmount) / rate : 0;

      // convert litecoin to correct subunit
      const amountInSats = amount * 100000000;
      const amountInSubunit = satsToSubunit(amountInSats, subunit);
      dispatch(updateAmountAction(amountInSubunit.toFixed(4)));
    }
  };

export const updateSendLabel =
  (label: string): AppThunk =>
  dispatch => {};

// slice
export const inputSlice = createSlice({
  name: 'input',
  initialState,
  reducers: {
    resetInputs: state => ({
      ...state,
      amount: '',
      fiatAmount: '',
      send: {
        toAddress: '',
        label: '',
        amount: 0,
        fee: 0,
      },
    }),
    updateAmountAction: (state, action: PayloadAction<string>) => ({
      ...state,
      amount: action.payload,
    }),
    updateFiatAmountAction: (state, action: PayloadAction<string>) => ({
      ...state,
      fiatAmount: action.payload,
    }),
    updateSendAmount(state, action: PayloadAction<number>) {
      state.send.amount = action.payload;
    },
    updateSendAddress(state, action: PayloadAction<string>) {
      state.send.toAddress = action.payload;
    },
  },
});

export default inputSlice.reducer;
