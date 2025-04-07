import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {walletBalance, walletKitListUnspent} from 'react-native-turbo-lnd';

import {AppThunk} from './types';
import {poll} from '../lib/utils/poll';

// types
type UtxoBalance = {
  regularConfirmedBalance: bigint;
  privateConfirmedBalance: bigint;
};

interface IBalanceState {
  totalBalance: string;
  confirmedBalance: string;
  unconfirmedBalance: string;
  lockedBalance: string;
  reservedBalanceAnchorChan: string;
  regularConfirmedBalance: string;
  privateConfirmedBalance: string;
}

// initial state
const initialState = {
  totalBalance: '',
  confirmedBalance: '',
  unconfirmedBalance: '',
  lockedBalance: '',
  reservedBalanceAnchorChan: '',
  regularConfirmedBalance: '',
  privateConfirmedBalance: '',
} as IBalanceState;

// actions
const getBalanceAction = createAction<IBalanceState>(
  'balance/getBalanceAction',
);

// functions
export const getBalance = (): AppThunk => async dispatch => {
  try {
    const walletBalanceResponse = await walletBalance({});
    const {regularConfirmedBalance, privateConfirmedBalance} =
      await calculateBalancesByType();

    const {
      confirmedBalance,
      unconfirmedBalance,
      lockedBalance,
      reservedBalanceAnchorChan,
      totalBalance,
    } = walletBalanceResponse;

    dispatch(
      getBalanceAction({
        confirmedBalance: confirmedBalance.toString(),
        unconfirmedBalance: unconfirmedBalance.toString(),
        lockedBalance: lockedBalance.toString(),
        reservedBalanceAnchorChan: reservedBalanceAnchorChan.toString(),
        totalBalance: totalBalance.toString(),
        regularConfirmedBalance: regularConfirmedBalance.toString(),
        privateConfirmedBalance: privateConfirmedBalance.toString(),
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

export const pollBalance = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getBalance()));
};

const calculateBalancesByType = (): Promise<UtxoBalance> => {
  return new Promise(async (resolve, reject) => {
    try {
      const listUnspentResponse = await walletKitListUnspent({});

      if (!listUnspentResponse || !listUnspentResponse.utxos) {
        return reject(new Error('Invalid response from ListUnspent'));
      }

      const balancesByType: UtxoBalance = {
        regularConfirmedBalance: 0n,
        privateConfirmedBalance: 0n,
      };

      listUnspentResponse.utxos.forEach(utxo => {
        const addressType = utxo.addressType;
        const amountSat = utxo.amountSat;

        // MWEB address type = 6
        // ignore type error
        if (addressType === 6) {
          balancesByType.privateConfirmedBalance += amountSat;
        } else {
          balancesByType.regularConfirmedBalance += amountSat;
        }
      });

      resolve(balancesByType);
    } catch (error) {
      reject(error);
    }
  });
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
      regularConfirmedBalance: action.payload.regularConfirmedBalance,
      privateConfirmedBalance: action.payload.privateConfirmedBalance,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default balanceSlice.reducer;
