import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {newAddress, AddressType} from 'react-native-nitro-lndltc';
import type {NewAddressResponse} from 'react-native-nitro-lndltc';
import {AppThunk} from './types';

// types
interface IAddress {
  address: string;
  regularAddress: string;
  mwebAddress: string;
}

// initial state
const initialState = {
  address: '',
  regularAddress: '',
  mwebAddress: '',
} as IAddress;

// actions
const getAddressAction = createAction<NewAddressResponse['address']>(
  'address/getAddressAction',
);
const setRegularAddressAddressAction = createAction<string>(
  'address/setRegularAddressAddressAction',
);
const setMWEBAddressAddressAction = createAction<string>(
  'address/setMWEBAddressAddressAction',
);

// functions
export const getAddress =
  (mwebAddress?: boolean): AppThunk =>
  async dispatch => {
    try {
      const type = mwebAddress
        ? AddressType.MWEB
        : AddressType.UNUSED_WITNESS_PUBKEY_HASH;
      const address = await newAddress({type});

      dispatch(getAddressAction(address.address));

      if (mwebAddress) {
        dispatch(setMWEBAddressAddressAction(address.address));
      } else {
        dispatch(setRegularAddressAddressAction(address.address));
      }
    } catch (error) {
      console.error(`getAddress error: ${error}`);
    }
  };

export const setRegularAddressAddress =
  (regularAddress: string): AppThunk =>
  async dispatch => {
    dispatch(setRegularAddressAddressAction(regularAddress));
  };

export const setMWEBAddressAddress =
  (mwebAddress: string): AppThunk =>
  async dispatch => {
    dispatch(setMWEBAddressAddressAction(mwebAddress));
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
    setRegularAddressAddressAction: (state, action) => ({
      ...state,
      regularAddress: action.payload,
    }),
    setMWEBAddressAddressAction: (state, action) => ({
      ...state,
      mwebAddress: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default addressSlice.reducer;
