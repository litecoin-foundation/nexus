import NitroBSX, {
  startBackgroundService,
  stopBackgroundService,
} from 'react-native-nitro-bsx';

import type {
  MbsxInfo,
  MbsxSettings,
  SwapDetails,
  SwapRequestDetails,
  SwapRequestSummary,
  SwapSummary,
} from '../types';
import {loadOrCreateConfig, MBSX_DATA_DIR} from './config';
import {leasedRequestIds, releaseAllLeases, releaseLeases} from './leases';
import {spendableBalance} from './prevouts';
import {signSwapTx} from './signTx';
import {APP_TYPE_NEXUS, deriveMainExtkey} from './mainKey';

export {
  defaultConfig,
  MBSX_DATA_DIR,
  readConfig,
  writeConfig,
} from './config';
export {recordLeases, releaseLeases, releasePrevouts} from './leases';
export {
  selectAndLeasePrevouts,
  serialisePrevout,
  spendableBalance,
} from './prevouts';
export type {SelectedPrevout} from './prevouts';
export type {CoinConfig, ElectrumServer, MbsxConfig} from './config';

// The module reports "busy" when it could not take its locks. It is not a
// failure: the next onMessage tick retries, so callers keep their last data.
export const BUSY = 'busy';

// The port test_glueserver.py expects, matching the example app's harness.
const DEBUG_RPC_PORT = 31311;

type MbsxResult<T> = T & {error?: string};

const isBusy = (rv: {error?: string}) => rv.error === BUSY;

// isRunning() is not a readiness check: initialise() sets it before connecting
// the bridge, so it stays true after a failed start. Only a zero return from
// initialise() means the core is usable, and that is what this records.
let started = false;

export const isRunning = () => started && NitroBSX.isRunning();

export const start = async () => {
  if (isRunning()) {
    return;
  }
  // A js reload leaves the native core running with `started` reset. Re-running
  // initialise() on it would be worse than adopting what is already there.
  if (NitroBSX.isRunning()) {
    started = true;
    return;
  }

  await loadOrCreateConfig();

  // Must precede initialise(): the core can ask for a key during startup while
  // it reactivates in-flight swaps.
  installKeyProvider();
  installSigner();
  installBalanceProvider();

  if (NitroBSX.setDataDir(MBSX_DATA_DIR) !== 0) {
    throw new Error(`mbsx could not use its data directory ${MBSX_DATA_DIR}`);
  }
  // Also before initialise(): a module given its key never generates or stores
  // one, so this is what keeps the seed phrase the only thing to back up.
  NitroBSX.setAppType(APP_TYPE_NEXUS);
  NitroBSX.setMainExtkey(await deriveMainExtkey());
  if (NitroBSX.initialise() !== 0) {
    throw new Error('mbsx failed to initialise');
  }

  started = true;
  startBackgroundService();

  // Tests only. __DEV__ so metro strips it from a release bundle, and the native
  // listener is compiled out of a release build regardless (BSX_DEBUG_RPC), so
  // this is belt and braces rather than the only guard. Loopback, reached with
  // `adb forward tcp:31311 tcp:31311`.
  if (__DEV__ && NitroBSX.startDebugRpc(DEBUG_RPC_PORT) !== 0) {
    console.warn('mbsx debug rpc did not start');
  }
};

// Terminal states, from SwapStates::to_str in the module. Anything else — an
// unrecognised state included — counts as active: keeping the core up costs
// battery, whereas stopping mid-swap can cost the funds locked in it.
const TERMINAL_STATES = new Set([
  'COMPLETED',
  'FAILED',
  'FAILED_REFUNDED',
  'FAILED_SWIPED',
  'FAILED_SWIPED_USED_MERCY',
  'TIMEDOUT',
  'ABANDONED',
  'REJECTED',
  'EXPIRED',
  'ERROR',
]);

/**
 * Frees the coins behind any request whose swaps have all finished, and behind a
 * request that errored before producing one. Called on the same tick that
 * decides whether the core can stop, so it does not need a timer of its own.
 */
export const reconcileLeases = async () => {
  for (const requestId of leasedRequestIds()) {
    const request = getRequestInfo(requestId);
    if (request === null) {
      continue; // Core is down, so nothing is known: leave the lease alone.
    }
    const swapIds = request.swapids ?? [];
    if (swapIds.length === 0) {
      if (request.error) {
        await releaseLeases(requestId);
      }
      continue;
    }
    // Every swap, not any: one request can produce several, and coins are only
    // free once none of them can still spend them.
    const allFinished = swapIds.every(swapId => {
      const swap = getSwapInfo(swapId);
      return swap !== null && TERMINAL_STATES.has(swap.state);
    });
    if (allFinished) {
      await releaseLeases(requestId);
    }
  }
};

export const hasActiveSwaps = () => {
  const swaps = listSwaps();
  if (swaps === null) {
    return false;
  }
  return swaps.some(swap => !TERMINAL_STATES.has(swap.state));
};

export const stop = () => {
  if (!isRunning()) {
    return;
  }
  NitroBSX.stop();
  stopBackgroundService();
  started = false;
};

// Leaving the section must not abandon a swap that has coins locked on chain,
// so the core outlives the ui that started it.
export const stopIfIdle = async () => {
  // Still here as the backstop: a request that errored before producing a swap
  // never emits a state change for the watcher to see.
  await reconcileNow();
  if (!isRunning() || hasActiveSwaps()) {
    return false;
  }
  stop();
  return true;
};

export const getVersion = () => NitroBSX.getVersionString();

let reconciling = false;
let reconcileAgain = false;

const reconcileNow = async () => {
  if (reconciling) {
    reconcileAgain = true;
    return;
  }
  reconciling = true;
  try {
    do {
      reconcileAgain = false;
      await reconcileLeases();
    } while (reconcileAgain);
  } catch (e) {
    console.warn('mbsx could not reconcile leases', e);
  } finally {
    reconciling = false;
  }
};

/**
 * Frees a swap's coins as soon as it ends, rather than when the section closes.
 *
 * Subscribe once, above the screens: a lease outlives any of them, and leaving
 * the coins locked until lnd's own timer lapses is indistinguishable to the user
 * from the wallet losing them.
 */
export const watchForFinishedSwaps = () =>
  NitroBSX.onMessage((payload: {type: string; data: string}) => {
    if (payload.type !== 'event') {
      return;
    }
    try {
      const event = JSON.parse(payload.data);
      if (
        event.event_type === 'STATE_CHANGED' &&
        TERMINAL_STATES.has(event.event_sub_type)
      ) {
        void reconcileNow();
      }
    } catch {
      // Not an event we can read, so not one that ends a swap.
    }
  });

export const onMessage = NitroBSX.onMessage;
export const onSettingsChanged = NitroBSX.onSettingsChanged;

// Every read below reaches the native core, which is only safe once
// initialise() has run. Calling before that crashes rather than returning an
// error, so isRunning() gates all of them.
export const listSwaps = (): SwapSummary[] | null => {
  if (!isRunning()) {
    return null;
  }
  const rv = NitroBSX.listSwaps() as MbsxResult<{swaps?: SwapSummary[]}>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx listSwaps failed:', rv.error);
    }
    return null;
  }
  return rv.swaps ?? [];
};

export const listRequests = (): SwapRequestSummary[] | null => {
  if (!isRunning()) {
    return null;
  }
  const rv = NitroBSX.listRequests() as MbsxResult<{
    requests?: SwapRequestSummary[];
  }>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx listRequests failed:', rv.error);
    }
    return null;
  }
  return rv.requests ?? [];
};

export const getSwapInfo = (swapId: string): SwapDetails | null =>
  isRunning() ? (NitroBSX.getSwapInfo(swapId) as SwapDetails) : null;

export const getRequestInfo = (
  requestId: string,
): SwapRequestDetails | null =>
  isRunning()
    ? (NitroBSX.getRequestInfo(requestId) as SwapRequestDetails)
    : null;

export const getSettings = (): MbsxSettings | null =>
  isRunning() ? (NitroBSX.getSettings() as MbsxSettings) : null;

export const getInfo = (): MbsxInfo | null =>
  isRunning() ? (NitroBSX.getInfo() as MbsxInfo) : null;

export const getMemStats = () => NitroBSX.getMemStats();

export const setSettings = (settings: Partial<MbsxSettings>) =>
  NitroBSX.setSettings(settings) as MbsxResult<{}>;

// Regtest only: clears swap and chain data but keeps settings, so a new test
// can run against a new chain without restarting the app.
export const resetState = async () => {
  // Before the wipe: afterwards nothing links the leases to a swap, and the
  // coins would stay locked until lnd expires them.
  await releaseAllLeases();
  const rv = NitroBSX.resetState() as MbsxResult<{}>;
  clearKeys();
  return rv;
};

export type SwapRequest = {
  coin_from: string;
  coin_to: string;
  // Decimal strings in whole coins. The module parses them against the coin's
  // own scale, so a value it displayed round-trips exactly and a fractional
  // amount cannot be lost to a double.
  amount_from: string;
  amount_to: string;
  address_to: string;
  // Where lock tx a's change goes, and the whole amount if the swap fails. This
  // side owns the funding, so it owns the change: p2wpkh only, which is all the
  // 20 byte wire field can carry. Omitted, the module uses its own wallet.
  change_address?: string;
  outputs: string[];
};

export const requestSwap = (request: SwapRequest) =>
  NitroBSX.requestSwap(request) as Promise<MbsxResult<{request_id: string}>>;

/**
 * A decimal amount in whole coins to the coin's smallest unit, by the module's
 * own conversion — so what lnd is asked to fund is the same number the module
 * derives from the string it is sent, rather than a second implementation that
 * could disagree.
 */
export const parseAmount = (coin: string, amount: string): bigint => {
  if (!isRunning()) {
    throw new Error('Swaps are not running');
  }
  return NitroBSX.parseAmount(coin, amount);
};

export const acceptSwap = (swapId: string) =>
  NitroBSX.acceptSwap(swapId) as Promise<MbsxResult<{}>>;

// Nothing fills this on Nexus: the ltc wallet is a host wallet, which derives
// its own keys and signs through installSigner rather than handing keys over.
// It stays for a coin configured with a debug wallet, which would ask.
// Registering must happen once before initialise() and outlive every screen, so
// the store lives here rather than in a component.
const keys = new Map<string, string>();

export const registerKey = (key: string) => {
  keys.set(NitroBSX.getKeyID(key), key);
};

export const clearKeys = () => keys.clear();

// Only reached for key ids the module cannot derive itself: the funding prevouts
// this side owns. Everything under the mbsx extkey is resolved in the module.
export const installKeyProvider = () => {
  NitroBSX.setGetKey((keyId: string, _coin: string) => keys.get(keyId) ?? '');
};

// The module hands over whole transactions rather than asking for keys, because
// lnd will sign but never export. Returning '' is a refusal the module reports
// rather than broadcasting anything.
export const installSigner = () => {
  NitroBSX.setSignTx(async (psbtHex: string, _coin: string) => {
    try {
      return await signSwapTx(psbtHex);
    } catch (e) {
      console.warn('mbsx could not sign a swap transaction', e);
      return '';
    }
  });
};

// The module holds no coins for a host wallet, so what it can fund is a question
// only this side can answer. A throw is what tells it the balance is unknown;
// returning 0n would read as an empty wallet, which is a different thing.
export const installBalanceProvider = () => {
  NitroBSX.setGetBalance(async (coin: string) => {
    if (coin.toUpperCase() !== 'LTC') {
      throw new Error(`mbsx asked for a ${coin} balance, which Nexus has not`);
    }
    return await spendableBalance();
  });
};


