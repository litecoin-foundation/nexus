import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {newAddress, AddressType} from 'react-native-nitro-lndltc';
import type {NewAddressResponse} from 'react-native-nitro-lndltc';
import {AppThunk} from './types';
import {
  isHwWalletSelectedSelector,
  selectedAccountNamesSelector,
} from './wallets';

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
  async (dispatch, getState) => {
    try {
      const {ltcAccount, mwebAccount} =
        selectedAccountNamesSelector(getState());

      // A hardware wallet's MWEB spend key stays on the device, so lnd cannot
      // derive its MWEB addresses — those come from the Jade in the Receive
      // flow. Refuse them here rather than minting a wrong address.
      if (mwebAddress && isHwWalletSelectedSelector(getState())) {
        throw new Error(
          'MWEB addresses for hardware wallets must come from the device',
        );
      }

      const type = mwebAddress
        ? AddressType.MWEB
        : AddressType.UNUSED_WITNESS_PUBKEY_HASH;
      const account = mwebAddress ? mwebAccount : ltcAccount;
      const address = await newAddress({type, account});

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
