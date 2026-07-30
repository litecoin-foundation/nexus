import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';

export type MbsxMessage = {id: number; data: string};

interface IMbsx {
  running: boolean;
  messages: MbsxMessage[];
  error: string | null;
}

const initialState: IMbsx = {
  running: false,
  messages: [],
  error: null,
};

const MAX_MESSAGES = 200;

export const mbsxSlice = createSlice({
  name: 'mbsx',
  initialState,
  reducers: {
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.running = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
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

export const {setRunning, setError, pushMessage, clearMessages} =
  mbsxSlice.actions;

export default mbsxSlice.reducer;
