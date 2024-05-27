import {createAction, createSlice} from '@reduxjs/toolkit';
import * as Lnd from '../lib/lightning/onchain';
import {AppThunk} from './types';

// types
interface IAddress {
  address: string;
}

// initial state
const initialState = {
  address: '',
} as IAddress;

// actions
const getAddressAction = createAction<string>('address/getAddressAction');

// functions
export const getAddress =
  (mwebAddress?: boolean): AppThunk =>
  async dispatch => {
    try {
      const {address} = await Lnd.newAddress(mwebAddress ? 7 : undefined);
      dispatch(getAddressAction(address));
    } catch (error) {
      console.error(`getAddress error: ${error}`);
    }
  };

// slice
export const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    getAddressAction: (state, action) => ({
      ...state,
      address: action.payload,
    }),
  },
});

export default addressSlice.reducer;
