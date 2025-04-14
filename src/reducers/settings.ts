import {createAction, createSlice} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
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
import {checkFlexaCustomer} from '../reducers/buy';

// types
interface ISettings {
  lastViewSeed: string | null;
  subunit: number;
  currencyCode: string;
  currencySymbol: string;
  defaultExplorer: string;
  mwebDefaultExplorer: string;
  languageCode: string;
  languageTag: string;
  deviceNotificationToken: string;
  notificationsEnabled: boolean;
  testPaymentActive: boolean;
  testPaymentKey: boolean;
  testPaymentMethod: string;
  testPaymentCountry: string;
  testPaymentFiat: string;
}
type CurrencyCodeType = {
  currencyCode: string;
  currencySymbol: string;
};
type LanguageType = {
  languageCode: string;
  languageTag: string;
};
type TestPaymentType = {
  testPaymentActive: boolean;
  testPaymentKey: boolean;
  testPaymentMethod: string;
  testPaymentCountry: string;
  testPaymentFiat: string;
};

// initial state
const initialState = {
  lastViewSeed: null,
  subunit: 0,
  currencyCode: 'USD',
  currencySymbol: '$',
  defaultExplorer: 'Litecoin Space',
  mwebDefaultExplorer: 'MWEB Explorer',
  languageCode: 'en',
  languageTag: 'en-US',
  deviceNotificationToken: '',
  notificationsEnabled: false,
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
const setLanguageAction = createAction<LanguageType>(
  'settings/setLanguageAction',
);
const setDeviceNotificationTokenAction = createAction<string>(
  'settings/setDeviceNotificationTokenAction',
);
const enableNotificationsAction = createAction<boolean>(
  'settings/enableNotificationsAction',
);
const setTestPaymentAction = createAction<TestPaymentType>(
  'settings/setTestPaymentAction',
);

// functions
export const getCurrencySymbol = (code: string): string => {
  const codeFormatted = code.toUpperCase();
  const currencySymbolObject = fiat.find(e => e.code === codeFormatted);
  const currencySymbol = currencySymbolObject?.symbol_native || '';
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

export const setLanguage =
  (languageCode: string, languageTag: string): AppThunk =>
  dispatch => {
    dispatch(setLanguageAction({languageCode, languageTag}));
  };

export const setDeviceNotificationToken =
  (deviceToken: string): AppThunk =>
  dispatch => {
    dispatch(setDeviceNotificationTokenAction(deviceToken));
  };

export const setNotificationsEnabled =
  (isEnabled: boolean): AppThunk =>
  dispatch => {
    dispatch(enableNotificationsAction(isEnabled));
  };

export const setTestPayment =
  (
    testPaymentActive: boolean,
    testPaymentKey: boolean,
    testPaymentMethod: string,
    testPaymentCountry: string,
    testPaymentFiat: string,
  ): AppThunk =>
  dispatch => {
    dispatch(
      setTestPaymentAction({
        testPaymentActive,
        testPaymentKey,
        testPaymentMethod,
        testPaymentCountry,
        testPaymentFiat,
      }),
    );
    dispatch(checkFlexaCustomer());
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
    setLanguageAction: (state, action) => ({
      ...state,
      languageCode: action.payload.languageCode,
      languageTag: action.payload.languageTag,
    }),
    setDeviceNotificationTokenAction: (state, action) => ({
      ...state,
      deviceNotificationToken: action.payload,
    }),
    enableNotificationsAction: (state, action) => ({
      ...state,
      notificationsEnabled: action.payload,
    }),
    setTestPaymentAction: (state, action) => ({
      ...state,
      testPaymentActive: action.payload.testPaymentActive,
      testPaymentKey: action.payload.testPaymentKey,
      testPaymentMethod: action.payload.testPaymentMethod,
      testPaymentCountry: action.payload.testPaymentCountry,
      testPaymentFiat: action.payload.testPaymentFiat,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
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
        return explorers[0].tx + txHash;
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
