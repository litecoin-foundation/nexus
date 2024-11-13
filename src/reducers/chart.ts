import {createAction, createSlice, createSelector} from '@reduxjs/toolkit';

import {AppThunk} from './types';
import {updateHistoricalRates} from './ticker';
import percentageDiff from '../lib/utils/percentageDiff';
import {RootState} from '../store';

// types
type GraphPeriodType = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface ICursorValue {
  x: string;
  y: number;
}

interface IChart {
  cursorSelected: boolean;
  cursorDate: null;
  cursorValue: null;
  graphPeriod: GraphPeriodType;
}

// initial state
const initialState = {
  cursorSelected: false,
  cursorDate: null,
  cursorValue: null,
  graphPeriod: '1D',
} as IChart;

// actions
const changeGraphPeriodAction = createAction<GraphPeriodType>(
  'chart/changeGraphPeriodAction',
);
const updateCursorValueAction = createAction<ICursorValue>(
  'chart/updateCursorValueAction',
);
const setCursorSelectedAction = createAction<boolean>(
  'chart/setCursorSelectedAction',
);

// functions
export const changeGraphPeriod =
  (graphPeriod: GraphPeriodType): AppThunk =>
  dispatch => {
    dispatch(changeGraphPeriodAction(graphPeriod));
    dispatch(updateHistoricalRates());
  };

export const updateCursorValue =
  (x: object, y: number): AppThunk =>
  dispatch => {
    dispatch(updateCursorValueAction({x: `${x}`, y}));
  };

export const setCursorSelected =
  (bool: boolean): AppThunk =>
  dispatch => {
    dispatch(setCursorSelectedAction(bool));
  };

// selectors

// find percentage difference
// divides current price by price at start of timespan
const chartPercentageDaySelector = createSelector(
  state => state.ticker.day,
  dayRates => {
    console.log('LOSHY');
    if (dayRates === undefined) {
      console.log('LOSHY: dayRATES UNDEFINED');
      return 0;
    }
    if (dayRates.length === 0) {
      console.log('LOSHY: dayRATES LENGTH 0');
      return 0;
    }
    console.log(dayRates);
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
  (state: RootState) => state.chart.graphPeriod,
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

// slice
export const chartSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    changeGraphPeriodAction: (state, action) => ({
      ...state,
      graphPeriod: action.payload,
    }),
    updateCursorValueAction: (state, action) => ({
      ...state,
      cursorDate: action.payload.x,
      cursorValue: action.payload.y,
    }),
    setCursorSelectedAction: (state, action) => ({
      ...state,
      cursorSelected: action.payload,
    }),
  },
});

export default chartSlice.reducer;
