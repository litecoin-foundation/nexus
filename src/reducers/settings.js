import {createSelector} from '@reduxjs/toolkit';
import memoize from 'lodash.memoize';
import {getCurrencies} from 'react-native-localize';

import fiat from '../assets/fiat';
import explorers from '../assets/explorers';

// initial state
const initialState = {
  lastViewSeed: null,
  subunit: 0,
  currencyCode: 'USD',
  currencySymbol: '$',
  defaultExplorer: 'Litecoin Space',
};

// constants
const UPDATE_LAST_VIEW_SEED = 'UPDATE_LAST_VIEW_SEED';
const UPDATE_SUBUNIT = 'UPDATE_SUBUNIT';
const UPDATE_COUNTRY_CODE = 'UPDATE_COUNTRY_CODE';
const UPDATE_DEFAULT_EXPLORER = 'UPDATE_DEFAULT_EXPLORER';

// actions
export const updateLastViewSeed = () => dispatch => {
  dispatch({
    type: UPDATE_LAST_VIEW_SEED,
    time: new Date(),
  });
};

export const updateSubunit = index => dispatch => {
  dispatch({
    type: UPDATE_SUBUNIT,
    subunit: index,
  });
};

export const detectCurrencyCode = () => dispatch => {
  const currencyCode = getCurrencies()[0];
  const currencySymbolObject = fiat.find(e => e.code === currencyCode);
  const currencySymbol = currencySymbolObject.symbol_native;
  dispatch({
    type: UPDATE_COUNTRY_CODE,
    currencyCode,
    currencySymbol,
  });
};

export const setCurrencyCode = (currencyCode, currencySymbol) => dispatch => {
  dispatch({
    type: UPDATE_COUNTRY_CODE,
    currencyCode,
    currencySymbol,
  });
};

export const setExplorer = explorer => dispatch => {
  dispatch({
    type: UPDATE_DEFAULT_EXPLORER,
    explorer: explorer,
  });
};

// action handlers
const actionHandler = {
  [UPDATE_LAST_VIEW_SEED]: (state, {time}) => ({
    ...state,
    lastViewSeed: time,
  }),
  [UPDATE_SUBUNIT]: (state, {subunit}) => ({...state, subunit}),
  [UPDATE_COUNTRY_CODE]: (state, {currencyCode, currencySymbol}) => ({
    ...state,
    currencyCode,
    currencySymbol,
  }),
  [UPDATE_DEFAULT_EXPLORER]: (state, {explorer}) => ({
    ...state,
    defaultExplorer: explorer,
  }),
};

// selectors

export const subunitSelector = createSelector(
  state => state.settings.subunit,
  subunit =>
    memoize(satoshi => {
      switch (subunit) {
        case 0: // litecoin
          return satoshi / 100000000;
        case 1: // lites
          return satoshi / 100000;
        case 2: // photons
          return satoshi / 100;
        default:
          // always default litecoin
          return satoshi / 100000000;
      }
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
        return explorerObject.tx + txHash;
      default:
        return explorerObject.tx + txHash;
    }
  },
);

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
