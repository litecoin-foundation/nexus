import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';

import type {MbsxConfig} from './adapter/config';
import type {CoinRate, RateSource, SourceResult} from './rates';

export type MbsxMessage = {id: number; data: string};

interface IMbsx {
  running: boolean;
  torApplied: boolean | null;
  connected: boolean;
  messages: MbsxMessage[];
  error: string | null;
  startupStep: string | null;
  settingsDraft: MbsxConfig | null;
  settingsSavedJson: string | null;
  settingsStoredJson: string | null;
  rates: Record<string, CoinRate>;
  rateResults: Partial<Record<RateSource, SourceResult>>;
}

const initialState: IMbsx = {
  running: false,
  torApplied: null,
  connected: false,
  messages: [],
  error: null,
  startupStep: null,
  settingsDraft: null,
  settingsSavedJson: null,
  settingsStoredJson: null,
  rates: {},
  rateResults: {},
};

const MAX_MESSAGES = 200;

export const mbsxSlice = createSlice({
  name: 'mbsx',
  initialState,
  reducers: {
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.running = action.payload;
    },
    setTorApplied: (state, action: PayloadAction<boolean | null>) => {
      state.torApplied = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setStartupStep: (state, action: PayloadAction<string | null>) => {
      state.startupStep = action.payload;
    },
    draftLoaded: (
      state,
      action: PayloadAction<{
        config: MbsxConfig;
        savedJson: string;
        storedJson: string;
      }>,
    ) => {
      state.settingsDraft = action.payload.config;
      state.settingsSavedJson = action.payload.savedJson;
      state.settingsStoredJson = action.payload.storedJson;
    },
    draftChanged: (state, action: PayloadAction<MbsxConfig | null>) => {
      state.settingsDraft = action.payload;
    },
    draftSaved: (state, action: PayloadAction<string>) => {
      state.settingsSavedJson = action.payload;
      state.settingsStoredJson = action.payload;
    },
    pushMessage: (state, action: PayloadAction<string>) => {
      const nextId = (state.messages[state.messages.length - 1]?.id ?? -1) + 1;
      const messages =
        state.messages.length < MAX_MESSAGES
          ? state.messages
          : state.messages.slice(state.messages.length - MAX_MESSAGES + 1);
      state.messages = [...messages, {id: nextId, data: action.payload}];
    },
    clearMessages: state => {
      state.messages = [];
    },
    // Merged, so a source that fails one round leaves the last rates to age out
    ratesFetched: (
      state,
      action: PayloadAction<{
        rates: Record<string, CoinRate>;
        results: Partial<Record<RateSource, SourceResult>>;
      }>,
    ) => {
      state.rates = {...state.rates, ...action.payload.rates};
      state.rateResults = {...state.rateResults, ...action.payload.results};
    },
    ratesCleared: state => {
      state.rates = {};
      state.rateResults = {};
    },
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => initialState);
  },
});

export const {
  setRunning,
  setTorApplied,
  setConnected,
  setError,
  setStartupStep,
  draftLoaded,
  draftChanged,
  draftSaved,
  pushMessage,
  clearMessages,
  ratesFetched,
  ratesCleared,
} = mbsxSlice.actions;

export default mbsxSlice.reducer;
