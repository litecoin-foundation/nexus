import {createSelector} from '@reduxjs/toolkit';

import {updateHistoricalRates} from './ticker';
import percentageDiff from '../lib/utils/percentageDiff';

// initial state
const initialState = {
  cursorSelected: false,
  cursorDate: null,
  cursorValue: null,
  graphPeriod: '1D',
};

// constants
export const CHANGE_GRAPH_PERIOD = 'CHANGE_GRAPH_PERIOD';
export const UPDATE_CURSOR_VALUE = 'UPDATE_CURSOR_VALUE';
export const SET_CURSOR_SELECTED = 'SET_CURSOR_SELECTED';

// actions
export const changeGraphPeriod = graphPeriod => dispatch => {
  dispatch({
    type: CHANGE_GRAPH_PERIOD,
    graphPeriod,
  });
  dispatch(updateHistoricalRates());
};

export const updateCursorValue = (x, y) => dispatch => {
  dispatch({
    type: UPDATE_CURSOR_VALUE,
    x: `${x}`,
    y,
  });
};

export const setCursorSelected = bool => dispatch => {
  dispatch({
    type: SET_CURSOR_SELECTED,
    bool,
  });
};

// action handlers
const actionHandler = {
  [CHANGE_GRAPH_PERIOD]: (state, {graphPeriod}) => ({...state, graphPeriod}),
  [UPDATE_CURSOR_VALUE]: (state, {x, y}) => ({
    ...state,
    cursorDate: x,
    cursorValue: y,
  }),
  [SET_CURSOR_SELECTED]: (state, {bool}) => ({...state, cursorSelected: bool}),
};

// selectors

// find percentage difference
// divides current price by price at start of timespan
const chartPercentageDaySelector = createSelector(
  state => state.ticker.day,
  dayRates => {
    if (dayRates.length === 0) {
      return 0;
    }
    return percentageDiff(dayRates[0][3], dayRates[dayRates.length - 1][3]);
  },
);

const chartPercentageWeekSelector = createSelector(
  state => state.ticker.week,
  weeksRate => {
    if (weeksRate.length === 0) {
      return 0;
    }
    return percentageDiff(weeksRate[0][3], weeksRate[weeksRate.length - 1][3]);
  },
);

const chartPercentageMonthSelector = createSelector(
  state => state.ticker.month,
  monthsRate => {
    if (monthsRate.length === 0) {
      return 0;
    }
    return percentageDiff(
      monthsRate[0][3],
      monthsRate[monthsRate.length - 1][3],
    );
  },
);

export const chartPercentageChangeSelector = createSelector(
  chartPercentageDaySelector,
  chartPercentageWeekSelector,
  chartPercentageMonthSelector,
  state => state.chart.graphPeriod,
  (day, week, month, graphPeriod) => {
    switch (graphPeriod) {
      case '1D':
        return day;
      case '1W':
        return week;
      case '1M':
        return month;
    }
  },
);

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
