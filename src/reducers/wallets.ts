import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';

import {AppThunk} from './types';
import {RootState} from '../store';

// types
export interface IMainWallet {
  id: 'main';
  type: 'main';
  label: string;
}

export interface IHwWallet {
  id: string;
  type: 'hw';
  label: string; // user-editable display name
  masterFingerprint: string; // 8-char lowercase hex
  xpub: string; // account xpub (BIP84 m/84'/2'/0')
  accountPath: number[];
  ltcAccountName: string; // lnd watch-only account: `hw-ltc-<fp>`
  mwebAccountName: string; // lnd watch-only account: `hw-mweb-<fp>`
  mwebSpendPubkeyHex: string;
  mwebNextAddressIndex: number;
  lastKnownBleDeviceId?: string;
  addedAt: number;
}

export type Wallet = IMainWallet | IHwWallet;

export interface ISelectedAccountNames {
  ltcAccount: string;
  mwebAccount: string;
}

interface IWalletsState {
  wallets: Wallet[]; // always contains the Main wallet at index 0
  selectedWalletId: string; // defaults to MAIN_WALLET_ID
}

// constants
export const MAIN_WALLET_ID = 'main';
export const DEFAULT_ACCOUNT = 'default';

const MAIN_WALLET: IMainWallet = {
  id: MAIN_WALLET_ID,
  type: 'main',
  label: 'main_wallet',
};

// initial state
const initialState = {
  wallets: [MAIN_WALLET],
  selectedWalletId: MAIN_WALLET_ID,
} as IWalletsState;

// actions
const addHwWalletAction = createAction<IHwWallet>('wallets/addHwWalletAction');
const removeHwWalletAction = createAction<string>(
  'wallets/removeHwWalletAction',
);
const selectWalletAction = createAction<string>('wallets/selectWalletAction');
const setMwebNextAddressIndexAction = createAction<{id: string; index: number}>(
  'wallets/setMwebNextAddressIndexAction',
);
const setLastBleDeviceIdAction = createAction<{id: string; deviceId: string}>(
  'wallets/setLastBleDeviceIdAction',
);
const renameHwWalletAction = createAction<{id: string; label: string}>(
  'wallets/renameHwWalletAction',
);

// functions
export const addHwWallet =
  (wallet: IHwWallet): AppThunk =>
  dispatch => {
    dispatch(addHwWalletAction(wallet));
  };

export const removeHwWallet =
  (id: string): AppThunk =>
  dispatch => {
    dispatch(removeHwWalletAction(id));
  };

export const selectWallet =
  (id: string): AppThunk =>
  dispatch => {
    dispatch(selectWalletAction(id));
  };

export const setMwebNextAddressIndex =
  (id: string, index: number): AppThunk =>
  dispatch => {
    dispatch(setMwebNextAddressIndexAction({id, index}));
  };

export const setLastBleDeviceId =
  (id: string, deviceId: string): AppThunk =>
  dispatch => {
    dispatch(setLastBleDeviceIdAction({id, deviceId}));
  };

export const renameHwWallet =
  (id: string, label: string): AppThunk =>
  dispatch => {
    dispatch(renameHwWalletAction({id, label}));
  };

// helpers
type HwWalletPatch = Partial<
  Pick<IHwWallet, 'label' | 'lastKnownBleDeviceId' | 'mwebNextAddressIndex'>
>;

// Patch a single HW wallet by id, returning new state. The Main wallet and any
// non-matching ids are left untouched.
const updateHwWallet = (
  state: IWalletsState,
  id: string,
  patch: HwWalletPatch,
): IWalletsState => ({
  ...state,
  wallets: state.wallets.map(w =>
    w.type === 'hw' && w.id === id ? {...w, ...patch} : w,
  ),
});

// slice
export const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addHwWalletAction: (state, action: PayloadAction<IHwWallet>) => {
      if (action.payload.id === MAIN_WALLET_ID) {
        return state;
      }
      const exists = state.wallets.some(
        w => w.type === 'hw' && w.id === action.payload.id,
      );
      return {
        ...state,
        wallets: exists
          ? state.wallets.map(w =>
              w.type === 'hw' && w.id === action.payload.id
                ? action.payload
                : w,
            )
          : [...state.wallets, action.payload],
      };
    },
    removeHwWalletAction: (state, action: PayloadAction<string>) => {
      // only HW wallets can be removed; the Main wallet is always retained
      const wallets = state.wallets.filter(
        w => w.type === 'main' || w.id !== action.payload,
      );
      // keep the selection valid: fall back to Main if it no longer exists
      const stillSelected = wallets.some(w => w.id === state.selectedWalletId);
      return {
        ...state,
        wallets,
        selectedWalletId: stillSelected
          ? state.selectedWalletId
          : MAIN_WALLET_ID,
      };
    },
    selectWalletAction: (state, action: PayloadAction<string>) => ({
      ...state,
      selectedWalletId: state.wallets.some(w => w.id === action.payload)
        ? action.payload
        : MAIN_WALLET_ID,
    }),
    setMwebNextAddressIndexAction: (
      state,
      action: PayloadAction<{id: string; index: number}>,
    ) =>
      updateHwWallet(state, action.payload.id, {
        mwebNextAddressIndex: action.payload.index,
      }),
    setLastBleDeviceIdAction: (
      state,
      action: PayloadAction<{id: string; deviceId: string}>,
    ) =>
      updateHwWallet(state, action.payload.id, {
        lastKnownBleDeviceId: action.payload.deviceId,
      }),
    renameHwWalletAction: (
      state,
      action: PayloadAction<{id: string; label: string}>,
    ) =>
      updateHwWallet(state, action.payload.id, {label: action.payload.label}),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

// selectors
export const walletsSelector = (state: RootState) => state.wallets.wallets;

export const selectedWalletIdSelector = (state: RootState) =>
  state.wallets.selectedWalletId;

export const selectedWalletSelector = createSelector(
  walletsSelector,
  selectedWalletIdSelector,
  (wallets, selectedWalletId): Wallet =>
    wallets.find(w => w.id === selectedWalletId) ?? MAIN_WALLET,
);

export const selectedAccountNamesSelector = createSelector(
  selectedWalletSelector,
  (wallet): ISelectedAccountNames =>
    wallet.type === 'hw'
      ? {ltcAccount: wallet.ltcAccountName, mwebAccount: wallet.mwebAccountName}
      : {ltcAccount: DEFAULT_ACCOUNT, mwebAccount: DEFAULT_ACCOUNT},
);

export const isHwWalletSelectedSelector = createSelector(
  selectedWalletSelector,
  (wallet): boolean => wallet.type === 'hw',
);

export const hwWalletsSelector = createSelector(walletsSelector, wallets =>
  wallets.filter((w): w is IHwWallet => w.type === 'hw'),
);

export default walletsSlice.reducer;
