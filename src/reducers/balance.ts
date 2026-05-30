import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {walletBalance, walletKitListUnspent} from 'react-native-nitro-lndltc';

import {AppThunk} from './types';
import {poll} from '../utils/poll';
import {selectedAccountNamesSelector} from './wallets';

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
const sumBigInts = (values: bigint[]): bigint =>
  values.reduce((total, value) => total + value, 0n);

export const getBalance = (): AppThunk => async (dispatch, getState) => {
  try {
    const {ltcAccount, mwebAccount} = selectedAccountNamesSelector(getState());
    // Main maps both names to 'default', while a hardware wallet keeps regular
    // and MWEB outputs in two separate lnd accounts. Deduping keeps Main a
    // single call identical to the historical walletBalance({}).
    const accounts = Array.from(new Set([ltcAccount, mwebAccount]));

    // walletBalance and the listUnspent-derived split are independent, so run
    // both batches concurrently rather than one after the other.
    const [walletBalances, utxoBalances] = await Promise.all([
      Promise.all(accounts.map(account => walletBalance({account}))),
      Promise.all(accounts.map(account => calculateBalancesByType(account))),
    ]);

    dispatch(
      getBalanceAction({
        confirmedBalance: sumBigInts(
          walletBalances.map(b => b.confirmedBalance),
        ).toString(),
        unconfirmedBalance: sumBigInts(
          walletBalances.map(b => b.unconfirmedBalance),
        ).toString(),
        lockedBalance: sumBigInts(
          walletBalances.map(b => b.lockedBalance),
        ).toString(),
        reservedBalanceAnchorChan: sumBigInts(
          walletBalances.map(b => b.reservedBalanceAnchorChan),
        ).toString(),
        totalBalance: sumBigInts(
          walletBalances.map(b => b.totalBalance),
        ).toString(),
        regularConfirmedBalance: sumBigInts(
          utxoBalances.map(u => u.regularConfirmedBalance),
        ).toString(),
        privateConfirmedBalance: sumBigInts(
          utxoBalances.map(u => u.privateConfirmedBalance),
        ).toString(),
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

export const pollBalance = (): AppThunk => async dispatch => {
  await poll(() => dispatch(getBalance()));
};

const calculateBalancesByType = (account: string): Promise<UtxoBalance> => {
  return new Promise(async (resolve, reject) => {
    try {
      const listUnspentResponse = await walletKitListUnspent({account});

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
