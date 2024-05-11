import {createAction, createSlice} from '@reduxjs/toolkit';
import lnd from '@litecoinfoundation/react-native-lndltc';
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
    console.log(mwebAddress);
    const rpc = await lnd.getAddress(mwebAddress ? 7 : undefined);

    if (rpc.isErr()) {
      console.error(`getAddress error: ${rpc.error}`);
    }

    if (rpc.isOk()) {
      const {address} = rpc.value;
      console.log('poop');
      dispatch(getAddressAction(address));
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
