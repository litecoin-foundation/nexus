import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppThunk} from './types';

// types
interface IErrors {
  visible: boolean;
  message: string;
}

// initial state
const initialState = {
  visible: false,
  message: '',
} as IErrors;

// actions
const showErrorAction = createAction<string>('errors/showErrorAction');
const hideErrorAction = createAction('errors/hideErrorAction');

// functions
export const showError =
  (error: string): AppThunk =>
  dispatch => {
    dispatch(showErrorAction(error));
  };

export const hideError = (): AppThunk => dispatch => {
  dispatch(hideErrorAction());
};

// slice

export const errorsSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    showErrorAction: (state, action) => ({
      ...state,
      visible: true,
      message: action.payload,
    }),
    hideErrorAction: state => ({
      ...state,
      visible: false,
      message: '',
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default errorsSlice.reducer;
