import {createAction, createSlice} from '@reduxjs/toolkit';
import {newAddress} from 'react-native-turbo-lnd';
import {NewAddressResponse} from 'react-native-turbo-lnd/protos/lightning_pb';
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
const getAddressAction = createAction<NewAddressResponse>(
  'address/getAddressAction',
);

// functions
export const getAddress =
  (mwebAddress?: boolean): AppThunk =>
  async dispatch => {
    try {
      let type;
      if (mwebAddress) {
        type = 7;
      } else {
        type = 2;
      }
      const address = await newAddress({type});

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
