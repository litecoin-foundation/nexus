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
  cursorDate: number;
  cursorValue: number;
  graphPeriod: GraphPeriodType;
}

// initial state
const initialState = {
  cursorSelected: false,
  cursorDate: 0,
  cursorValue: 0,
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
    if (dayRates === undefined || null) {
      return 0;
    }
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

const chartPercentageQuarterSelector = createSelector(
  state => state.ticker.quarter,
  quarterRate => {
    if (quarterRate.length === 0) {
      return 0;
    }
    return percentageDiff(
      quarterRate[0][3],
      quarterRate[quarterRate.length - 1][3],
    );
  },
);

const chartPercentageYearSelector = createSelector(
  state => state.ticker.year,
  yearRate => {
    if (yearRate.length === 0) {
      return 0;
    }
    return percentageDiff(yearRate[0][3], yearRate[yearRate.length - 1][3]);
  },
);

const chartPercentageAllSelector = createSelector(
  state => state.ticker.year,
  allRate => {
    if (allRate.length === 0) {
      return 0;
    }
    return percentageDiff(allRate[0][3], allRate[allRate.length - 1][3]);
  },
);

export const chartPercentageChangeSelector = createSelector(
  chartPercentageDaySelector,
  chartPercentageWeekSelector,
  chartPercentageMonthSelector,
  chartPercentageQuarterSelector,
  chartPercentageYearSelector,
  chartPercentageAllSelector,
  (state: RootState) => state.chart.graphPeriod,
  (day, week, month, quarter, year, all, graphPeriod) => {
    switch (graphPeriod) {
      case '1D':
        return day;
      case '1W':
        return week;
      case '1M':
        return month;
      case '3M':
        return quarter;
      case '1Y':
        return year;
      case 'ALL':
        return all;
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
