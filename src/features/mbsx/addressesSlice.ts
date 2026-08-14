import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';

// Where a swap's proceeds land. External today: an address the user controls
// somewhere else, since mbsx holds no coins on the receiving chain. `source`
// exists so a module-derived address can be listed beside them later without
// migrating what is already saved.
export type MbsxAddress = {
  address: string;
  label: string;
  source: 'external';
  lastUsedAt: number;
};

interface IMbsxAddresses {
  // Keyed by coin ticker, most recently used first.
  byCoin: Record<string, MbsxAddress[]>;
  lastCoin: string;
}

const initialState: IMbsxAddresses = {byCoin: {}, lastCoin: ''};

const MAX_PER_COIN = 20;

export const mbsxAddressesSlice = createSlice({
  name: 'mbsxAddresses',
  initialState,
  reducers: {
    rememberAddress: (
      state,
      action: PayloadAction<{coin: string; address: string; label?: string}>,
    ) => {
      const {coin, address} = action.payload;
      if (!address) {
        return;
      }
      const existing = state.byCoin[coin] ?? [];
      const previous = existing.find(entry => entry.address === address);
      const entry: MbsxAddress = {
        address,
        // Re-saving without a label keeps the one it already had.
        label: action.payload.label ?? previous?.label ?? '',
        source: 'external',
        lastUsedAt: Date.now(),
      };
      state.byCoin[coin] = [
        entry,
        ...existing.filter(e => e.address !== address),
      ].slice(0, MAX_PER_COIN);
    },
    setLastCoin: (state, action: PayloadAction<string>) => {
      state.lastCoin = action.payload;
    },
    forgetAddress: (
      state,
      action: PayloadAction<{coin: string; address: string}>,
    ) => {
      const {coin, address} = action.payload;
      state.byCoin[coin] = (state.byCoin[coin] ?? []).filter(
        entry => entry.address !== address,
      );
    },
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => initialState);
  },
});

export const {rememberAddress, forgetAddress, setLastCoin} =
  mbsxAddressesSlice.actions;

export default mbsxAddressesSlice.reducer;
