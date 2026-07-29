import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {
  start,
  initWallet as initLndWallet,
  unlockWallet as unlockLndWallet,
  subscribeState,
  stopDaemon,
  WalletState,
} from 'react-native-nitro-lndltc';
import type {Subscription} from 'react-native-nitro-lndltc';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {AppThunk} from './types';
import {v4 as uuidv4} from 'uuid';
import {setItem, getItem} from '../utils/keychain';
import {
  deleteWalletDB,
  deleteLNDDir,
  deleteMacaroonFiles,
  deleteNeutrinoFiles,
  fileExists,
} from '../utils/file';
import {finishOnboarding, setRecoveryMode, setSeedRecovery} from './onboarding';
import {setRecoveryRestarted} from './info';
import {
  markRecoveryInProgress,
  clearRecoveryInProgress,
  isRecoveryInProgress,
} from '../utils/recovery';
import {setLitecoinBackend} from './settings';
import {subscribeTransactions} from './transaction';
import {pollInfo, pollPeers, pollRecoveryInfo} from './info';
import {pollRates} from './ticker';
import {pollBalance} from './balance';
import {pollTransactions} from './transaction';
import {createConfig} from '../utils/config';
import {stringToUint8Array} from '../utils';
import {sleep} from '../utils/poll';
import {purgeStore} from '../store';
import {resetPincode, unlockWalletAction} from './authentication';
import {resetToLoading} from '../navigation/NavigationService';

const PASS = 'PASSWORD';
const SEED_KEY = 'SEEDPHRASE';
const RESCAN_FLAG = 'RESCAN_WALLET_TRANSACTIONS';
const ELECTRUM_MIGRATION_FLAG = 'ELECTRUM_MIGRATION';

type MigrationStatusKey =
  | 'preparing'
  | 'cleaning_neutrino'
  | 'cleaning_wallet'
  | 'switching_backend'
  | 'complete';

// Single state subscription — stored to prevent GC
let _stateSub: Subscription | null = null;
let _pollersStarted = false;
// Session-only re-entrancy guard for the electrum migration. Intentionally a
// module variable (not persisted redux state) so it always starts false on a
// cold launch — see runElectrumMigrationIfNeeded.
let _migrationInFlight = false;

// types
interface ILightningState {
  lndActive: boolean;
  walletState: WalletState | null;
  isRescanningWallet: boolean;
  isMigrating: boolean;
  migrationProgress: number;
  migrationStatusKey: MigrationStatusKey | null;
}

// initial state
const initialState = {
  lndActive: false,
  walletState: null,
  isRescanningWallet: false,
  isMigrating: false,
  migrationProgress: 0,
  migrationStatusKey: null,
} as ILightningState;

// LND has finished unlocking and its RPC layer is usable.
export const isWalletRpcReady = (walletState: WalletState | null) =>
  walletState === WalletState.RPC_ACTIVE ||
  walletState === WalletState.SERVER_ACTIVE;

// actions
const lndState = createAction<boolean>('lightning/lndState');
const setWalletState = createAction<WalletState | null>(
  'lightning/setWalletState',
);
export const setRescanningWallet = createAction<boolean>(
  'lightning/setRescanningWallet',
);
const setMigratingAction = createAction<boolean>('lightning/setMigrating');
const setMigrationProgressAction = createAction<{
  progress: number;
  statusKey: MigrationStatusKey | null;
}>('lightning/setMigrationProgress');

// functions
export const startLnd = (): AppThunk => async (dispatch, getState) => {
  try {
    const {torEnabled, litecoinBackend} = getState().settings;
    await createConfig(torEnabled, litecoinBackend);

    // lnd dir path
    const appFolderPath = `${RNFS.DocumentDirectoryPath}/lndltc/`;

    // check if wallet.db is missing - if so, clean up stale macaroons before starting LND
    const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;
    const walletExists = await fileExists(dbPath);

    if (!walletExists) {
      await deleteMacaroonFiles();
    }

    // check if we need to rescan wallet transactions
    const needsRescan = await getItem(RESCAN_FLAG);
    let startFlags = ` --lnddir=${appFolderPath}`;

    if (needsRescan === 'true') {
      startFlags += ' --reset-wallet-transactions';
      console.log('Starting LND with --reset-wallet-transactions flag');
    }

    // start LND
    await start(startFlags);

    // Single state subscription for the entire app lifecycle
    _stateSub = subscribeState(
      async response => {
        dispatch(setWalletState(response.state));

        if (response.state === WalletState.NON_EXISTING) {
          dispatch(lndState(true));
        } else if (response.state === WalletState.LOCKED) {
          dispatch(lndState(true));
        } else if (response.state === WalletState.UNLOCKED) {
          dispatch(lndState(true));

          // During onboarding, UNLOCKED means wallet was just created
          const {isOnboarded} = getState().onboarding!;
          if (!isOnboarded) {
            dispatch(finishOnboarding());
          }
        } else if (
          response.state === WalletState.RPC_ACTIVE ||
          response.state === WalletState.SERVER_ACTIVE
        ) {
          dispatch(lndState(true));

          // Start pollers once
          if (!_pollersStarted) {
            _pollersStarted = true;

            dispatch(pollInfo());
            dispatch(pollRecoveryInfo());
            if (getState().settings.litecoinBackend !== 'electrum') {
              dispatch(pollPeers());
            }
            dispatch(pollRates());
            dispatch(pollTransactions());
            dispatch(subscribeTransactions());
            dispatch(pollBalance());

            dispatch(unlockWalletAction);
          }

          // Clear rescan flag if needed
          if (needsRescan === 'true') {
            await setItem(RESCAN_FLAG, 'false');
            console.log('wallet rescan flag cleared, rescanning in progress');
          }
        }
      },
      error => {
        console.error('subscribeState error:', error);
      },
    );
  } catch (err) {
    console.error('CANT start LND');
    console.error(err);
  }
};

export const stopLnd = (): AppThunk => async dispatch => {
  try {
    await stopDaemon();
  } catch (err) {
    console.error('STOPLND: Error calling stopDaemon:', err);
  }

  _stateSub?.cancel();
  _stateSub = null;
  _pollersStarted = false;

  dispatch(lndState(false));
  dispatch(setWalletState(null));
};

export const resetLndState = (): AppThunk => async dispatch => {
  dispatch(lndState(false));
};

export const initWallet = (): AppThunk => async (dispatch, getState) => {
  const {seed, beingRecovered} = getState().onboarding!;

  const password: string = uuidv4();
  await setItem(PASS, password);

  try {
    await deleteWalletDB();
    await initLndWallet({
      cipherSeedMnemonic: seed,
      walletPassword: stringToUint8Array(password),
      recoveryWindow: beingRecovered === true ? 3000 : 0,
    });
    if (beingRecovered === true) {
      await markRecoveryInProgress();
    } else {
      await clearRecoveryInProgress();
    }
  } catch (error) {
    console.error(error);
  }
};

export const unlockWallet = (): AppThunk => async (dispatch, getState) => {
  let password = await getItem(PASS);

  const dbPath = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet/wallet.db`;

  // check if wallet exists, otherwise initWallet
  if ((await fileExists(dbPath)) === false) {
    const {seed} = getState().onboarding!;

    if (seed && seed.length > 0) {
      // wallet.db missing but seed phrase exists - attempting recovery
      try {
        dispatch(setRecoveryMode(true));
        await dispatch(initWallet());
        dispatch(setRecoveryMode(false));
        return;
      } catch (recoveryError) {
        console.error('Failed to recover wallet from seed:', recoveryError);
        dispatch(setRecoveryMode(false));
        return;
      }
    } else {
      // No seed phrase available - trigger complete wallet reset
      await dispatch(handleWalletReset());
      return;
    }
  }

  try {
    if (password !== null) {
      const recoveryInterrupted = await isRecoveryInProgress();
      await unlockLndWallet({
        walletPassword: stringToUint8Array(password),
        recoveryWindow: recoveryInterrupted ? 3000 : 0,
      });
      // Set explicitly (not only on true) so a stale persisted value from a
      // previous session is reset on a normal unlock.
      dispatch(setRecoveryRestarted(recoveryInterrupted));
    } else {
      throw new Error('wallet password is null');
    }
  } catch (error: any) {
    if (
      error.message ===
      'rpc error: code = Unknown desc = wallet already unlocked, WalletUnlocker service is no longer available'
    ) {
      console.log('wallet unlocked already!');
    } else {
      throw new Error(String(error));
    }
  }
};

export const rescanWallet = (): AppThunk => async dispatch => {
  try {
    console.log('RESCAN: Start wallet rescan');
    // Set flag to rescan on next LND start
    dispatch(setRescanningWallet(true));
    await setItem(RESCAN_FLAG, 'true');

    // Stop LND
    console.log('RESCAN: Stopping LND');
    await dispatch(stopLnd());
    console.log('RESCAN: LND has been stopped');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start LND (which will now include --reset-wallet-transactions flag)
    console.log('RESCAN: Starting LND with rescan flag');
    await dispatch(startLnd());
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('RESCAN: Auto-unlock wallet');
    await dispatch(unlockWallet());
  } catch (error) {
    console.error('RESCAN: Error during wallet rescan:', error);
    dispatch(setRescanningWallet(false));
    await setItem(RESCAN_FLAG, 'false');
    throw error;
  }
};

// Run the neutrino → electrum migration BEFORE LND starts for this session.
// Doing it pre-start avoids restarting lndmobile mid-session, which is
// unreliable. After this thunk completes, Loading dispatches startLnd
// and the existing missing-wallet.db branch in unlockWallet runs initWallet
// in recovery mode against the new electrum backend.
export const runElectrumMigrationIfNeeded =
  (): AppThunk => async (dispatch, getState) => {
    // Re-entrancy guard for the current session only. We deliberately do NOT
    // gate on the persisted `isMigrating` flag: it survives restarts, so a kill
    // mid-migration (or at the unacknowledged "complete" modal) would otherwise
    // permanently block both the reconcile below and a migration retry.
    if (_migrationInFlight) {
      return;
    }

    const flag = await getItem(ELECTRUM_MIGRATION_FLAG);
    if (flag === 'true') {
      // Migration already ran. The durable keychain flag is the source of
      // truth: the backend setting persists via redux-persist independently,
      // so a crash/kill between flipping the backend and that flush can leave
      // the rehydrated backend on 'neutrino'. Reconcile it to electrum before
      // startLnd builds the config, otherwise LND reconnects to neutrino.
      if (getState().settings.litecoinBackend !== 'electrum') {
        dispatch(setLitecoinBackend('electrum'));
      }
      // Clear any stale migration UI persisted from a session that finished the
      // migration but was killed before the user acknowledged the modal.
      if (getState().lightning.isMigrating) {
        dispatch(setMigratingAction(false));
        dispatch(setMigrationProgressAction({progress: 0, statusKey: null}));
      }
      return;
    }

    // Refuse to delete anything if the seed isn't reachable — without it,
    // the unlock-time initWallet would have nothing to recover from.
    const seedFromKeychain = await getItem(SEED_KEY);
    if (!seedFromKeychain) {
      console.warn('electrum migration: aborting, no seed in keychain');
      return;
    }
    const seedArr = seedFromKeychain.split(',');
    if (seedArr.length < 12) {
      console.warn('electrum migration: aborting, malformed seed');
      return;
    }

    const mainnetDir = `${RNFS.DocumentDirectoryPath}/lndltc/data/chain/litecoin/mainnet`;
    const hasNeutrinoState =
      (await fileExists(`${mainnetDir}/neutrino.db`)) ||
      (await fileExists(`${mainnetDir}/block_headers.bin`)) ||
      (await fileExists(`${mainnetDir}/reg_filter_headers.bin`));

    const currentBackend = getState().settings.litecoinBackend;

    if (currentBackend === 'electrum' && !hasNeutrinoState) {
      await setItem(ELECTRUM_MIGRATION_FLAG, 'true');
      return;
    }

    _migrationInFlight = true;
    dispatch(setMigratingAction(true));

    try {
      const reduxSeed = getState().onboarding!.seed;
      if (!reduxSeed || reduxSeed.length === 0) {
        await dispatch(setSeedRecovery(seedArr));
      }

      dispatch(
        setMigrationProgressAction({progress: 8, statusKey: 'preparing'}),
      );
      await sleep(600);

      dispatch(
        setMigrationProgressAction({
          progress: 30,
          statusKey: 'cleaning_neutrino',
        }),
      );
      await deleteNeutrinoFiles();
      await sleep(600);

      dispatch(
        setMigrationProgressAction({
          progress: 60,
          statusKey: 'cleaning_wallet',
        }),
      );
      await Promise.all([deleteWalletDB(), deleteMacaroonFiles()]);
      await sleep(600);

      dispatch(
        setMigrationProgressAction({
          progress: 85,
          statusKey: 'switching_backend',
        }),
      );
      dispatch(setLitecoinBackend('electrum'));
      await sleep(600);

      // Persist the flag before flipping to 'complete' so a crash mid-render
      // can't leave the modal in the awaiting-ack state with the migration
      // not actually marked done.
      await setItem(ELECTRUM_MIGRATION_FLAG, 'true');
      dispatch(
        setMigrationProgressAction({progress: 100, statusKey: 'complete'}),
      );
    } catch (error) {
      console.error('electrum migration failed:', error);
      dispatch(setMigratingAction(false));
      dispatch(setMigrationProgressAction({progress: 0, statusKey: null}));
    } finally {
      _migrationInFlight = false;
    }
  };

export const acknowledgeMigration = (): AppThunk => dispatch => {
  dispatch(setMigratingAction(false));
  dispatch(setMigrationProgressAction({progress: 0, statusKey: null}));
};

export const handleWalletReset = (): AppThunk => async dispatch => {
  try {
    await dispatch(resetPincode());
    await purgeStore();
    await deleteLNDDir();

    resetToLoading();
  } catch (error) {
    console.error('Error during wallet reset:', error);
    throw error;
  }
};

// slicer
export const lightningSlice = createSlice({
  name: 'lightning',
  initialState,
  reducers: {
    lndState: (state, action: PayloadAction<boolean>) => ({
      ...state,
      lndActive: action.payload,
    }),
    setWalletState: (state, action: PayloadAction<WalletState | null>) => ({
      ...state,
      walletState: action.payload,
    }),
    setRescanningWallet: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isRescanningWallet: action.payload,
    }),
    setMigrating: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isMigrating: action.payload,
    }),
    setMigrationProgress: (
      state,
      action: PayloadAction<{
        progress: number;
        statusKey: MigrationStatusKey | null;
      }>,
    ) => ({
      ...state,
      migrationProgress: action.payload.progress,
      migrationStatusKey: action.payload.statusKey,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default lightningSlice.reducer;
