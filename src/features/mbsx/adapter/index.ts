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

export {
  defaultConfig,
  MBSX_DATA_DIR,
  readConfig,
  writeConfig,
} from './config';
export type {CoinConfig, ElectrumServer, MbsxConfig} from './config';

// The module reports "busy" when it could not take its locks. It is not a
// failure: the next onMessage tick retries, so callers keep their last data.
export const BUSY = 'busy';

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

  if (NitroBSX.setDataDir(MBSX_DATA_DIR) !== 0) {
    throw new Error(`mbsx could not use its data directory ${MBSX_DATA_DIR}`);
  }
  if (NitroBSX.initialise() !== 0) {
    throw new Error('mbsx failed to initialise');
  }

  started = true;
  startBackgroundService();
};

// Terminal states, from SwapStates::to_str in the module. Anything else — an
// unrecognised state included — counts as active: keeping the core up costs
// battery, whereas stopping mid-swap can cost the funds locked in it.
const TERMINAL_STATES = new Set([
  'COMPLETED',
  'FAILED',
  'FAILED_REFUNDED',
  'FAILED_SWIPED',
  'TIMEDOUT',
  'ABANDONED',
  'REJECTED',
  'EXPIRED',
  'ERROR',
]);

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
export const stopIfIdle = () => {
  if (!isRunning() || hasActiveSwaps()) {
    return false;
  }
  stop();
  return true;
};

export const getVersion = () => NitroBSX.getVersionString();

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
export const resetState = () => {
  const rv = NitroBSX.resetState() as MbsxResult<{}>;
  clearKeys();
  clearPrevouts();
  return rv;
};

export type SwapRequest = {
  coin_from: string;
  coin_to: string;
  amount_from: number;
  amount_to: number;
  address_to: string;
  outputs: string[];
};

export const requestSwap = (request: SwapRequest) =>
  NitroBSX.requestSwap(request) as Promise<MbsxResult<{request_id: string}>>;

export const acceptSwap = (swapId: string) =>
  NitroBSX.acceptSwap(swapId) as Promise<MbsxResult<{}>>;

// WS4 seam. The module asks for a key by id whenever it needs to sign; off
// regtest it has no other source, since getRandomKey is debug-only. Registering
// must happen once before initialise() and outlive every screen, so the store
// lives here rather than in a component.
const keys = new Map<string, string>();

export const registerKey = (key: string) => {
  keys.set(NitroBSX.getKeyID(key), key);
};

export const clearKeys = () => keys.clear();

export const installKeyProvider = () => {
  NitroBSX.setGetKey((keyId: string) => keys.get(keyId) ?? '');
};

// WS4 seam. Funding outpoints as hex, keyed by coin ticker. Until Nexus's
// wallet fills these, CreateSwap has nothing to spend and says so.
const prevouts = new Map<string, string[]>();

export const setPrevouts = (coin: string, outputs: string[]) => {
  prevouts.set(coin.toUpperCase(), outputs);
};

export const getPrevouts = (coin: string) => prevouts.get(coin.toUpperCase());

export const clearPrevouts = () => prevouts.clear();
