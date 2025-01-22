import {createAction, createSlice} from '@reduxjs/toolkit';
import {createSelector} from '@reduxjs/toolkit';
import memoize from 'lodash.memoize';
import {getCurrencies} from 'react-native-localize';

import {AppThunk} from './types';
import fiat from '../assets/fiat';
import explorers from '../assets/explorers';
import {
  litecoinToSubunit,
  satsToSubunit,
  subunitToSats,
} from '../lib/utils/satoshis';

// types
interface ISettings {
  lastViewSeed: string | null;
  subunit: number;
  currencyCode: string;
  currencySymbol: string;
  defaultExplorer: string;
  mwebDefaultExplorer: string;
  deviceNotificationToken: string;
}
type CurrencyCodeType = {
  currencyCode: string;
  currencySymbol: string;
};

// initial state
const initialState = {
  lastViewSeed: null,
  subunit: 0,
  currencyCode: 'USD',
  currencySymbol: '$',
  defaultExplorer: 'Litecoin Space',
  mwebDefaultExplorer: 'MWEB Explorer',
  deviceNotificationToken: '',
} as ISettings;

// actions
const updateLastViewSeedAction = createAction<string>(
  'settings/updateLastViewSeedAction',
);
const updateSubunitAction = createAction<number>(
  'settings/updateSubunitAction',
);
const setCurrencyCodeAction = createAction<CurrencyCodeType>(
  'settings/setCurrencyCodeAction',
);
const setExplorerAction = createAction<string>('settings/setExplorerAction');
const setMWEBExplorerAction = createAction<string>(
  'settings/setMWEBExplorerAction',
);
const setDeviceNotificationTokenAction = createAction<string>(
  'settings/setDeviceNotificationTokenAction',
);

// functions
export const getCurrencySymbol = (code: string): string => {
  const codeFormatted = code.toUpperCase();
  const currencySymbolObject = fiat.find(e => e.code === codeFormatted);
  const currencySymbol = currencySymbolObject!.symbol_native;
  return currencySymbol;
};

export const updateLastViewSeed = (): AppThunk => dispatch => {
  const time = new Date().toJSON();
  dispatch(updateLastViewSeedAction(time));
};

export const updateSubunit =
  (index: number): AppThunk =>
  dispatch => {
    dispatch(updateSubunitAction(index));
  };

export const detectCurrencyCode = (): AppThunk => dispatch => {
  const currencyCode = getCurrencies()[0];
  const currencySymbolObject = fiat.find(e => e.code === currencyCode);
  const currencySymbol = currencySymbolObject!.symbol_native;
  dispatch(setCurrencyCodeAction({currencyCode, currencySymbol}));
};

export const setCurrencyCode =
  (currencyCode: string, currencySymbol: string): AppThunk =>
  dispatch => {
    dispatch(setCurrencyCodeAction({currencyCode, currencySymbol}));
  };

export const setExplorer =
  (explorer: string): AppThunk =>
  dispatch => {
    dispatch(setExplorerAction(explorer));
    dispatch(setMWEBExplorerAction('MWEB Explorer'));
  };

export const setDeviceNotificationToken =
  (deviceToken: string): AppThunk =>
  dispatch => {
    dispatch(setDeviceNotificationTokenAction(deviceToken));
  };

// slice
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateLastViewSeedAction: (state, action) => ({
      ...state,
      lastViewSeed: action.payload,
    }),
    updateSubunitAction: (state, action) => ({
      ...state,
      subunit: action.payload,
    }),
    setCurrencyCodeAction: (state, action) => ({
      ...state,
      currencyCode: action.payload.currencyCode,
      currencySymbol: action.payload.currencySymbol,
    }),
    setExplorerAction: (state, action) => ({
      ...state,
      defaultExplorer: action.payload,
    }),
    setMWEBExplorerAction: (state, action) => ({
      ...state,
      mwebDefaultExplorer: action.payload,
    }),
    setDeviceNotificationTokenAction: (state, action) => ({
      ...state,
      deviceNotificationToken: action.payload,
    }),
  },
});

// selectors
export const litecoinToSubunitSelector = createSelector(
  state => state.settings.subunit,
  subunit =>
    memoize((amount: number) => {
      return litecoinToSubunit(amount, subunit);
    }),
);

export const subunitToSatsSelector = createSelector(
  state => state.settings.subunit,
  subunit =>
    memoize((satoshi: number) => {
      return subunitToSats(satoshi, subunit);
    }),
);

export const satsToSubunitSelector = createSelector(
  state => state.settings.subunit,
  subunit =>
    memoize((satoshi: number) => {
      return satsToSubunit(satoshi, subunit);
    }),
);

export const subunitSymbolSelector = createSelector(
  state => state.settings.subunit,
  subunit => {
    switch (subunit) {
      case 0: // litecoin
        return 'Ł';
      case 1: // lites
        return 'ł';
      case 2: // photons
        return 'mł';
      default:
        // always default litecoin
        return 'Ł';
    }
  },
);

export const subunitCodeSelector = createSelector(
  state => state.settings.subunit,
  subunit => {
    switch (subunit) {
      case 0: // litecoin
        return 'LTC';
      case 1: // lites
        return 'lites';
      case 2: // photons
        return 'photons';
      default:
        // always default litecoin
        return 'LTC';
    }
  },
);

export const currencySymbolSelector = createSelector(
  state => state.settings.currencySymbol,
  currencySymbol => {
    return currencySymbol;
  },
);

export const defaultExplorerSelector = createSelector(
  [state => state.settings.defaultExplorer, (state, txHash) => txHash],
  (defaultExplorer, txHash) => {
    const explorerObject = explorers.find(e => e.key === defaultExplorer);
    switch (defaultExplorer) {
      case 'Litecoin Space':
      case 'Blockchair':
      case 'Bitinfocharts':
      case 'Blockcypher':
      case 'Litecoinblockexplorer':
      case 'MWEB Explorer':
        return explorerObject!.tx + txHash;
      default:
        return explorerObject!.tx + txHash;
    }
  },
);

export const mwebDefaultExplorerSelector = createSelector(
  [
    state => state.settings.mwebDefaultExplorer,
    (state, blockHeight) => blockHeight,
  ],
  (mwebDefaultExplorer, blockHeight) => {
    const explorerObject = explorers.find(e => e.key === mwebDefaultExplorer);

    switch (mwebDefaultExplorer) {
      case 'MWEB Explorer':
        return explorerObject!.block + blockHeight;
      default:
        return explorerObject!.block + blockHeight;
    }
  },
);

export default settingsSlice.reducer;
