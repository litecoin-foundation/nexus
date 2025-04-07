import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppThunk} from './types';

// types
interface IAuthpad {
  pin: string;
}

// initial state
const initialState = {
  pin: '',
} as IAuthpad;

// actions
const inputValueAction = createAction<string>('authpad/inputValueAction');
export const backspaceValue = createAction('authpad/backspaceValue');
export const clearValues = createAction('authpad/clearValues');

// functions
export const inputValue =
  (input: string): AppThunk =>
  (dispatch, getState) => {
    const {pin} = getState().authpad;
    if (pin.length >= 6) {
      return;
    }
    dispatch(inputValueAction(input));
  };

// slice
export const authpadSlice = createSlice({
  name: 'authpad',
  initialState,
  reducers: {
    inputValueAction: (state, action) => ({
      ...state,
      pin: state.pin + action.payload,
    }),
    backspaceValue: state => ({...state, pin: state.pin.slice(0, -1)}),
    clearValues: state => ({...state, pin: ''}),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default authpadSlice.reducer;
