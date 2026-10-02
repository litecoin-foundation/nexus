import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';

import type {MbsxConfig} from './adapter/config';

export type MbsxMessage = {id: number; data: string};

interface IMbsx {
  running: boolean;
  connected: boolean;
  messages: MbsxMessage[];
  error: string | null;
  startupStep: string | null;
  settingsDraft: MbsxConfig | null;
  settingsSavedJson: string | null;
  settingsStoredJson: string | null;
}

const initialState: IMbsx = {
  running: false,
  connected: false,
  messages: [],
  error: null,
  startupStep: null,
  settingsDraft: null,
  settingsSavedJson: null,
  settingsStoredJson: null,
};

const MAX_MESSAGES = 200;

export const mbsxSlice = createSlice({
  name: 'mbsx',
  initialState,
  reducers: {
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.running = action.payload;
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
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => initialState);
  },
});

export const {
  setRunning,
  setConnected,
  setError,
  setStartupStep,
  draftLoaded,
  draftChanged,
  draftSaved,
  pushMessage,
  clearMessages,
} = mbsxSlice.actions;

export default mbsxSlice.reducer;
