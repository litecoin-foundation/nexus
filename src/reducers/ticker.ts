import {createAction, createSlice, createSelector} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import memoize from 'lodash.memoize';

import {poll} from '../lib/utils/poll';
import {AppThunk} from './types';
import {setBuyQuote, setSellQuote, setLimits} from './buy';
import {IBuyQuote, ISellQuote} from '../utils/tradeQuotes';

// types
type PriceDataPoint = [number, number, number, number, number, number];

type IRates = {
  [key: string]: any;
};

type TGranulatedPriceData = {
  hourly: PriceDataPoint[];
  daily: PriceDataPoint[];
  all: PriceDataPoint[];
};

interface ITicker {
  ltcRate: number;
  buyRate: number;
  sellRate: number;
  isBuyRateApprox: boolean;
  isSellRateApprox: boolean;
}

// initial state
const initialState = {
  ltcRate: 0,
  buyRate: 0,
  sellRate: 0,
  isBuyRateApprox: false,
  isSellRateApprox: false,
  rates: {} as IRates,
  day: [],
  week: [],
  month: [],
  quarter: [],
  year: [],
  all: [],
} as ITicker;

// actions
const getTickerAction = createAction<IRates>('ticker/getTickerAction');
const updateRatesAction = createAction<{
  buy: number;
  sell: number;
  ltc: number;
  isBuyRateApprox: boolean;
  isSellRateApprox: boolean;
}>('ticker/updateRatesAction');
const updateHistoricRateDayAction = createAction<any>(
  'ticker/updateHistoricRateDayAction',
);
const updateHistoricRateWeekAction = createAction<any>(
  'ticker/updateHistoricRateWeekAction',
);
const updateHistoricRateMonthAction = createAction<any>(
  'ticker/updateHistoricRateMonthAction',
);
const updateHistoricRateQuarterAction = createAction<any>(
  'ticker/updateHistoricRateQuarterAction',
);
const updateHistoricRateYearAction = createAction<any>(
  'ticker/updateHistoricRateYearAction',
);
const updateHistoricRateAllAction = createAction<any>(
  'ticker/updateHistoricRateAllAction',
);

// functions
function isObjectEmpty(obj: {[key: string]: any}) {
  if (Object.getOwnPropertyNames(obj).length >= 1) {
    return false;
  } else {
    return true;
  }
}

const getTickerData = () => {
  return new Promise<{[key: string]: string}>(async (resolve, reject) => {
    try {
      const res = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=LTC',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (!res.ok) {
        const error = await res.json();
        reject(error);
      }

      const {
        data: {rates},
      } = await res.json();

      resolve(rates);
    } catch (error) {
      reject(error);
    }
  });
};

// NOTE: if we will call buy and sell quotes separately depending on what
// screen user's at it will be half amount of requests
export const callRates = (): AppThunk => async (dispatch, getState) => {
  const {currencyCode} = getState().settings;
  const {amount: ltcAmount} = getState().input;

  let isBuyRateApprox = false,
    isSellRateApprox = false;

  try {
    // Fetch buy quote, pass amount of 1 LTC for when ltcAmount is not set yet
    const buyQuote: IBuyQuote = await dispatch(
      setBuyQuote(Number(ltcAmount || 1)),
    );
    let buy = buyQuote ? Number(buyQuote.ltcPrice) : null;
    // Fetch sell quote, pass amount of 1 LTC for when ltcAmount is not set yet
    const sellQuote: ISellQuote = await dispatch(
      setSellQuote(Number(ltcAmount || 1)),
    );
    let sell = sellQuote ? Number(sellQuote.ltcPrice) : null;

    // Fetch ltc rates
    const rates = await getTickerData();
    let ltc = 0;
    if (rates && !isObjectEmpty(rates)) {
      ltc = Number(rates[currencyCode]);
    }

    // Set fallbacks after getting current ltc rate
    // with current currency
    // If quote is null/undefined/0 there was a fetching error
    // set coinbase rate instead
    if (!buy) {
      buy = ltc;
      isBuyRateApprox = true;
    }
    if (!sell) {
      sell = ltc;
      isSellRateApprox = true;
    }

    dispatch(getTickerAction(rates));
    dispatch(
      updateRatesAction({ltc, buy, sell, isBuyRateApprox, isSellRateApprox}),
    );
    dispatch(setLimits());
  } catch (error) {
    console.warn(error);
  }
};

export const pollRates = (): AppThunk => async dispatch => {
  await poll(async () => {
    try {
      dispatch(callRates());
    } catch (error) {
      console.warn(error);
    }
  }, 15000);
};

const fetchGranulatedHistoricalRates =
  async (): Promise<TGranulatedPriceData> => {
    const url = 'https://api.nexuswallet.com/api/prices/granulated';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return {hourly: [], daily: [], all: []} as TGranulatedPriceData;
    }

    const {data} = await res.json();
    return data;
  };

export const updatedRatesInFiat = (): AppThunk => async dispatch => {
  try {
    const rates = await getTickerData();
    dispatch(getTickerAction(rates));
  } catch (error) {
    console.error('Error fetching day historical rates:', error);
  }
};

export const updateHistoricalRatesForAllPeriods =
  (): AppThunk => async dispatch => {
    try {
      const granulatedPriceData: TGranulatedPriceData =
        await fetchGranulatedHistoricalRates();
      dispatch(segregateHistoricalRatesByPeriods(granulatedPriceData));
    } catch (error) {
      console.error('Failed to update historical rates:', error);
    }
  };

const segregateHistoricalRatesByPeriods =
  (granulatedPriceData: TGranulatedPriceData): AppThunk =>
  dispatch => {
    if (!granulatedPriceData) {
      return;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const dayData = granulatedPriceData.hourly.filter(item => {
      const itemDate = new Date(item[0] * 1000);
      return itemDate >= oneDayAgo;
    });
    const weekData = granulatedPriceData.hourly.filter(item => {
      const itemDate = new Date(item[0] * 1000);
      return itemDate >= oneWeekAgo;
    });
    const monthData = granulatedPriceData.daily.filter(item => {
      const itemDate = new Date(item[0] * 1000);
      return itemDate >= oneMonthAgo;
    });
    const quarterData = granulatedPriceData.daily.filter(item => {
      const itemDate = new Date(item[0] * 1000);
      return itemDate >= threeMonthsAgo;
    });
    const yearData = granulatedPriceData.daily.filter(item => {
      const itemDate = new Date(item[0] * 1000);
      return itemDate >= oneYearAgo;
    });

    dispatch(updateHistoricRateDayAction(dayData));
    dispatch(updateHistoricRateWeekAction(weekData));
    dispatch(updateHistoricRateMonthAction(monthData));
    dispatch(updateHistoricRateQuarterAction(quarterData));
    dispatch(updateHistoricRateYearAction(yearData));
    dispatch(updateHistoricRateAllAction(granulatedPriceData.all));
  };

// slice
export const tickerSlice = createSlice({
  name: 'ticker',
  initialState,
  reducers: {
    getTickerAction: (state, action) => ({
      ...state,
      rates: action.payload,
    }),
    updateHistoricRateDayAction: (state, action) => ({
      ...state,
      day: action.payload,
    }),
    updateHistoricRateWeekAction: (state, action) => ({
      ...state,
      week: action.payload,
    }),
    updateHistoricRateMonthAction: (state, action) => ({
      ...state,
      month: action.payload,
    }),
    updateHistoricRateQuarterAction: (state, action) => ({
      ...state,
      quarter: action.payload,
    }),
    updateHistoricRateYearAction: (state, action) => ({
      ...state,
      year: action.payload,
    }),
    updateHistoricRateAllAction: (state, action) => ({
      ...state,
      all: action.payload,
    }),
    updateRatesAction: (state, action) => ({
      ...state,
      ltcRate: action.payload.ltc,
      buyRate: action.payload.buy,
      sellRate: action.payload.sell,
      isBuyRateApprox: action.payload.isBuyRateApprox,
      isSellRateApprox: action.payload.isSellRateApprox,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

// selectors
export const ltcRateSelector = createSelector(
  state => state.ticker.rates,
  state => state.settings.currencyCode,
  (rates: {[key: string]: any}, currencyCode: string) => {
    if (rates[currencyCode] === undefined) {
      return rates.USD;
    } else {
      return rates[currencyCode];
    }
  },
);

export const convertLocalFiatToUSD = createSelector(
  state => state.settings.currencyCode,
  state => state.ticker.rates,
  (currencyCode: string, rates: {[key: string]: any}) => {
    const localToUSD = rates.USD / rates[currencyCode];
    return localToUSD;
  },
);

export const fiatValueSelector = createSelector(
  state => state.ticker.rates,
  state => state.settings.currencyCode,
  state => state.settings.currencySymbol,
  (rates: {[key: string]: any}, currencyCode: string, currencySymbol) =>
    memoize(
      satoshi =>
        `${currencySymbol}${(
          (satoshi / 100000000) *
          rates[currencyCode]
        ).toFixed(2)}`,
    ),
);

export const confirmSellFiatValueSelector = createSelector(
  state => state.ticker.rates,
  state => state.settings.currencyCode,
  (rates: {[key: string]: any}, currencyCode: string) =>
    memoize((amount: number) => `${(amount * rates[currencyCode]).toFixed(2)}`),
);

export const monthSelector = createSelector(
  state => state.chart.graphPeriod,
  state => state.ticker.day,
  state => state.ticker.week,
  state => state.ticker.month,
  state => state.ticker.quarter,
  state => state.ticker.year,
  state => state.ticker.all,
  (
    graphPeriod,
    dayData,
    weekData,
    monthData,
    quarterData,
    yearData,
    allData,
  ) => {
    let data: any[] = [];

    if (graphPeriod === '1D') {
      data = dayData as any[];
    } else if (graphPeriod === '1W') {
      data = weekData as any[];
    } else if (graphPeriod === '1M') {
      data = monthData as any[];
    } else if (graphPeriod === '3M') {
      data = quarterData as any[];
    } else if (graphPeriod === '1Y') {
      data = yearData as any[];
    } else if (graphPeriod === 'ALL') {
      data = allData as any[];
    }

    if (data === undefined || data === null || (data && data.length === 0)) {
      return [
        {
          x: new Date(),
          y: 0,
        },
      ];
    }

    const result = data.map(item => {
      return {
        x: new Date(item[0] * 1000),
        y: item[3],
      };
    });

    // sort array by date (old -> new)
    // by default Coinbase API returns new -> old
    result.sort(function (a, b) {
      return new Date(a.x) - new Date(b.x);
    });

    return result;
  },
);

export default tickerSlice.reducer;
