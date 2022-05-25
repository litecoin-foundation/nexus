import {createSelector} from '@reduxjs/toolkit';
import memoize from 'lodash.memoize';

// initial state
const initialState = {
  lastViewSeed: null,
  subunit: 0,
};

// constants
const UPDATE_LAST_VIEW_SEED = 'UPDATE_LAST_VIEW_SEED';
const UPDATE_SUBUNIT = 'UPDATE_SUBUNIT';

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

// action handlers
const actionHandler = {
  [UPDATE_LAST_VIEW_SEED]: (state, {time}) => ({
    ...state,
    lastViewSeed: time,
  }),
  [UPDATE_SUBUNIT]: (state, {subunit}) => ({...state, subunit}),
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

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
