import NitroBSX, {
  startBackgroundService,
  stopBackgroundService,
} from 'react-native-nitro-bsx';

import type {
  MbsxCoinPrices,
  MbsxInfo,
  MbsxSettings,
  SwapDetails,
  SwapRequestDetails,
  SwapRequestSummary,
  SwapSummary,
} from '../types';
import {pStore, store} from '../../../store';
import {canUseTorOnThisDevice, startTor} from '../../../utils/tor';
import {
  applyTorSetting,
  loadOrCreateConfig,
  MBSX_DATA_DIR,
  readConfig,
  writeConfig,
} from './config';
import type {MbsxConfig} from './config';
import {
  releaseAllLeases,
  releaseLeases,
  requestIdsWithLocks,
  withPendingOutputs,
} from './leases';
import {spendableBalance} from './prevouts';
import type {FundingOutput} from './prevouts';
import {signSwapTx} from './signTx';
import {APP_TYPE_NEXUS, deriveMainExtkey} from './mainKey';
import {scheduleWakes} from './wake';

export {defaultConfig, MBSX_DATA_DIR, readConfig, writeConfig} from './config';
export {
  recordLeases,
  releaseLeases,
  releasePrevouts,
  reservedBalance,
} from './leases';
export {
  displayTxid,
  selectAndLeasePrevouts,
  serialisePrevout,
  spendableBalance,
  swapBalances,
} from './prevouts';
export type {FundingOutput, SelectedPrevout} from './prevouts';
export type {
  CoinConfig,
  ElectrumServer,
  MbsxConfig,
  VerifyCertsMode,
} from './config';

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

// Nexus's Tor switch; a headless process asks before the persisted store is back.
const torPreference = (): Promise<boolean> =>
  new Promise(resolve => {
    const read = () => resolve(store.getState().settings.torEnabled === true);
    if (pStore.getState().bootstrapped) {
      read();
      return;
    }
    const unsubscribe = pStore.subscribe(() => {
      if (pStore.getState().bootstrapped) {
        unsubscribe();
        read();
      }
    });
  });

// tor_enabled is the navigator's, which owns the switch. Omitted, the proxy
// already in the config stands: an internal restart must not re-decide it.
export const start = async (tor_enabled?: boolean) => {
  // A js reload leaves the native core running with `started` reset. Re-running
  // initialise() on it would be worse than adopting what is already there.
  const running = NitroBSX.isRunning();
  if (running) {
    started = true;
  }
  if (running && tor_enabled === undefined) {
    return;
  }

  const config = await loadOrCreateConfig();
  if (tor_enabled !== undefined) {
    // Refusing beats starting in the clear: the user asked for tor, and on
    // armeabi-v7a Nexus has none to give.
    if (tor_enabled && !(await canUseTorOnThisDevice())) {
      if (running) {
        stop();
      }
      throw new Error('Tor is on, but this device cannot run it');
    }
    const updated = await applyTorSetting(config, tor_enabled);
    if (running) {
      if (updated === config) {
        return;
      }
      stop();
    }
  }

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
  stateWatch = watchSwapStates();
  startBackgroundService();
  scheduleWakes();

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
  // Not FAILED_SWIPED_USING_MERCY: chain b is still being recovered.
  'FAILED_SWIPED_MERCY_UNUSED',
  'TIMEDOUT',
  'ABANDONED',
  'REJECTED',
  'EXPIRED',
  'ERROR',
]);

// From SwapRequestStates::to_str: no further swap will come of these.
const ENDED_REQUEST_STATES = new Set(['EXPIRED', 'REVOKED', 'ERROR']);

// A request in these can still accept an offer, so its coins may yet fund a swap.
const OPEN_REQUEST_STATES = new Set(['SENT', 'OFFER_RECEIVED']);

/**
 * Frees the coins behind any request whose swaps have all finished, and behind a
 * request that errored before producing one. Called on the same tick that
 * decides whether the core can stop, so it does not need a timer of its own.
 */
export const reconcileLeases = async () => {
  const requestIds = requestIdsWithLocks();
  console.log(`mbsx reconciling leases of ${requestIds.length} request(s)`);
  for (const requestId of requestIds) {
    const request = getRequestInfo(requestId);
    if (request === null) {
      continue; // Core is down, so nothing is known: leave the lease alone.
    }
    // The module's reading, ahead of the TERMINAL_STATES copy below.
    if (request.swaps_active || OPEN_REQUEST_STATES.has(request.state)) {
      continue;
    }
    const swapIds = request.swapids ?? [];
    if (swapIds.length === 0) {
      if (request.error || ENDED_REQUEST_STATES.has(request.state)) {
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

export const isTerminalState = (state: string) => TERMINAL_STATES.has(state);

/**
 * Whether anything is still in flight, answered by the module rather than by
 * reading states here.
 *
 * The swapstates table is the only definition of "finished"; TERMINAL_STATES
 * below is a copy of it, and a copy drifts - a state added to the module and not
 * here reads as active for ever, and one removed abandons a live swap.
 *
 * Needs only setDataDir, so it is equally valid before the core is started.
 */
export const hasActiveSwaps = (): boolean => {
  const rv = NitroBSX.hasActiveSwaps() as MbsxResult<{has_swaps?: boolean}>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx hasActiveSwaps failed:', rv.error);
    }
    // Unknown is not the same as none: a swap that cannot be read still has
    // coins locked, so this must not be what stops the core or cancels a wake.
    return true;
  }
  return rv.has_swaps === true;
};

// Uppercase tickers, as the module reports them. A swap names its coins in its
// own chain a / chain b frame, so either field naming a coin means it is needed.
// Null when the swaps cannot be read: no coins and no answer must not look alike
// to a caller deciding whether a coin is safe to turn off.
export const coinsWithActiveSwaps = (): Set<string> | null => {
  const swaps = listSwaps();
  if (swaps === null) {
    return null;
  }
  const coins = new Set<string>();
  for (const swap of swaps) {
    if (!TERMINAL_STATES.has(swap.state)) {
      coins.add(swap.coin_from);
      coins.add(swap.coin_to);
    }
  }
  return coins;
};

export const stop = () => {
  if (!isRunning()) {
    return;
  }
  stateWatch?.remove();
  stateWatch = null;
  NitroBSX.stop();
  stopBackgroundService();
  started = false;
};

// Set while MbsxNavigator is mounted. A core resumed at launch has no ui above
// it and nothing to unmount, so the terminal-state watcher stops it instead -
// but it must not stop one the user is looking at.
let sectionMounted = false;

export const setSectionMounted = (mounted: boolean) => {
  sectionMounted = mounted;
};

// Leaving the section must not abandon a swap that has coins locked on chain,
// so the core outlives the ui that started it.
export const stopIfIdle = async () => {
  // Still here as the backstop: a request that errored before producing a swap
  // never emits a state change for the watcher to see.
  await reconcileNow();
  const idle = isRunning() && !hasActiveSwaps();
  console.log(`mbsx stopIfIdle: ${idle ? 'stopping' : 'staying up'}`);
  if (!idle) {
    return false;
  }
  stop();
  return true;
};

/**
 * Starts the core at launch when the db holds an unfinished swap, since a swap
 * with timelocks running needs no ui to be watched.
 *
 * hasActiveSwaps needs only setDataDir, so nothing in flight costs one file read
 * rather than a core start.
 */
export const resumeIfNeeded = async () => {
  if (isRunning()) {
    return false;
  }
  if (NitroBSX.setDataDir(MBSX_DATA_DIR) !== 0) {
    console.warn(`mbsx could not use its data directory ${MBSX_DATA_DIR}`);
    return false;
  }
  const rv = NitroBSX.hasActiveSwaps() as MbsxResult<{has_swaps?: boolean}>;
  if (rv.error) {
    console.warn('mbsx could not check for swaps to resume:', rv.error);
    return false;
  }
  if (!rv.has_swaps) {
    return false;
  }
  const tor_enabled = await torPreference();
  if (tor_enabled && !(await startTor())) {
    throw new Error('Tor is on, but it could not be started');
  }
  await start(tor_enabled);
  return true;
};

/**
 * Writes a config and reinitialises the core so it takes effect.
 *
 * An active swap is not a reason to defer this: initialise() reactivates
 * everything non-terminal from sqlite, so a restart resumes rather than
 * abandons. What it must not do is leave the core down — a swap that is not
 * reactivated has nothing watching its timelocks — so a start that fails puts
 * the previous config back and starts on that instead.
 */
export const applyConfig = async (config: MbsxConfig) => {
  const previous = await readConfig();
  await writeConfig(config);
  try {
    await restart();
  } catch (e) {
    if (previous) {
      await writeConfig(previous);
      try {
        await restart();
      } catch (rollbackError) {
        console.warn(
          'mbsx could not restart on the previous config',
          rollbackError,
        );
      }
    }
    throw e;
  }
};

const restart = async () => {
  stop();
  await start();
};

export const getVersion = () => NitroBSX.getVersionString();
export const getSqliteVersion = () => NitroBSX.getSqliteVersion();

let reconcilePending: Promise<void> | null = null;
let reconcileAgain = false;

// A second caller shares the run in flight, so a stop on its return sees its releases.
export const reconcileNow = (): Promise<void> => {
  if (reconcilePending) {
    reconcileAgain = true;
    return reconcilePending;
  }
  reconcilePending = (async () => {
    try {
      do {
        reconcileAgain = false;
        await reconcileLeases();
      } while (reconcileAgain);
    } catch (e) {
      console.warn('mbsx could not reconcile leases', e);
    } finally {
      reconcilePending = null;
    }
  })();
  return reconcilePending;
};

let stateWatch: {remove: () => void} | null = null;

/**
 * Frees a swap's coins as soon as it ends, rather than when the section closes.
 *
 * Subscribe once, above the screens: a lease outlives any of them, and leaving
 * the coins locked until lnd's own timer lapses is indistinguishable to the user
 * from the wallet losing them.
 */
const watchSwapStates = () =>
  NitroBSX.onMessage((payload: {type: string; data: string}) => {
    if (payload.type !== 'event') {
      return;
    }
    try {
      const event = JSON.parse(payload.data);
      const ended =
        event.event_type === 'STATE_CHANGED'
          ? TERMINAL_STATES.has(event.event_sub_type)
          : event.event_type === 'REQUEST_STATE_CHANGED'
            ? ENDED_REQUEST_STATES.has(event.event_sub_type)
            : null;
      if (ended === null) {
        return;
      }
      if (ended) {
        // stopIfIdle reconciles first, and declines while anything is active.
        void (sectionMounted ? reconcileNow() : stopIfIdle());
      }
      // Every state change, not only the last one: a swap starting changes what
      // there is to wake for as much as a swap ending. Armed on the terminal
      // state alone, a swap made while the app is open never gets an alarm - the
      // only one that did was one already in flight when start() ran.
      scheduleWakes();
    } catch {
      // Not an event we can read, so not one that changes a swap's state.
    }
  });

export const onMessage = NitroBSX.onMessage;
export const onSettingsChanged = NitroBSX.onSettingsChanged;
export const onBridgeState = NitroBSX.onBridgeState;

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

export const getRequestInfo = (requestId: string): SwapRequestDetails | null =>
  isRunning()
    ? (NitroBSX.getRequestInfo(requestId) as SwapRequestDetails)
    : null;

// Null when any of them could not be read. getSwapInfo reports BUSY when the
// module cannot take its locks, and dropping that swap would let the request
// read as finished on the strength of the ones that did answer.
const swapsOf = (request: SwapRequestDetails): SwapDetails[] | null => {
  const swaps: SwapDetails[] = [];
  for (const swapId of request.swapids ?? []) {
    const swap = getSwapInfo(swapId);
    if (swap === null || swap.error) {
      return null;
    }
    swaps.push(swap);
  }
  return swaps;
};

// Every offer it drew has ended, so nothing under it can still act.
export const requestFinished = (request: SwapRequestDetails): boolean => {
  const swaps = swapsOf(request);
  return (
    swaps !== null &&
    swaps.length > 0 &&
    swaps.every(swap => TERMINAL_STATES.has(swap.state))
  );
};

// It never came to anything: no offer is live, none is still acceptable, and a
// request with no offers at all has waited long enough to stop expecting one.
export const requestExpired = (request: SwapRequestDetails): boolean => {
  const swaps = swapsOf(request);
  if (swaps === null) {
    return false;
  }
  if (swaps.length === 0) {
    return (
      request.state === 'EXPIRED' ||
      Date.parse(`${request.expire_at}Z`) <= Date.now()
    );
  }
  return swaps.every(swap => {
    if (!TERMINAL_STATES.has(swap.state) && swap.state !== 'RECEIVED') {
      return false;
    }
    return (
      swap.state !== 'RECEIVED' ||
      Date.parse(`${swap.expire_at}Z`) <= Date.now()
    );
  });
};

/**
 * Purges a request and every swap under it.
 *
 * The leases go first: they are held against the request id, so once the row is
 * gone nothing links the locked coins to anything that could free them.
 */
/** Withdraws every open request; the module refuses any with an accepted offer. */
export const revokeOpenRequests = async (): Promise<string[]> => {
  if (!isRunning()) {
    return [];
  }
  const rv = NitroBSX.revokeOpenRequests() as MbsxResult<{revoked?: string[]}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
  return rv.revoked ?? [];
};

export const removeRequest = async (requestId: string) => {
  await releaseLeases(requestId);
  const rv = NitroBSX.removeRequest(requestId) as MbsxResult<{}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
};

export type CaCert = {
  id: bigint;
  label: string;
  host: string;
  port: number;
};

// The three below reach only the db, not the core, so unlike the reads above
// they need no isRunning() gate - and must not have one: a missing trust anchor
// is what stops the core starting, so it has to be addable while it is down.
export const listCaCerts = (): CaCert[] => {
  const rv = NitroBSX.listCaCerts() as MbsxResult<{certs?: CaCert[]}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
  return rv.certs ?? [];
};

/**
 * An empty host makes the anchor general; naming a server confines it to that
 * one, and replaces the general anchors for it rather than adding to them.
 */
export const addCaCert = (
  label: string,
  host: string,
  port: number,
  pem: string,
) => {
  const rv = NitroBSX.addCaCert(label, host, port, pem) as MbsxResult<{}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
};

export const removeCaCert = (id: bigint) => {
  const rv = NitroBSX.removeCaCert(id) as MbsxResult<{}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
};

export const removeSwap = (swapId: string) => {
  const rv = NitroBSX.removeSwap(swapId) as MbsxResult<{}>;
  if (rv.error) {
    throw new Error(rv.error);
  }
};

/**
 * Removes every request the predicate selects, and reports both counts.
 *
 * One request that will not go must not stop the rest: the module refuses a
 * swap that has not ended, and a bulk removal that abandons the whole batch
 * over one of those clears nothing at all.
 */
export const removeRequests = async (
  matches: (request: SwapRequestDetails) => boolean,
) => {
  let removed = 0;
  let refused = 0;
  for (const summary of listRequests() ?? []) {
    const request = getRequestInfo(summary.id);
    if (request === null || request.error || !matches(request)) {
      continue;
    }
    try {
      await removeRequest(summary.id);
      removed += 1;
    } catch (e) {
      console.warn(`mbsx could not remove request ${summary.id}`, e);
      refused += 1;
    }
  }
  return {removed, refused};
};

export const describeRemoval = (
  {removed, refused}: {removed: number; refused: number},
  nothing: string,
) => {
  if (removed === 0 && refused === 0) {
    return nothing;
  }
  const count = `Removed ${removed} request${removed === 1 ? '' : 's'}`;
  return refused === 0 ? count : `${count}, ${refused} still active`;
};

export const getSettings = (): MbsxSettings | null =>
  isRunning() ? (NitroBSX.getSettings() as MbsxSettings) : null;

export const getCoinPrices = (): MbsxCoinPrices | null => {
  if (!isRunning()) {
    return null;
  }
  const rv = NitroBSX.getCoinPrices() as MbsxResult<MbsxCoinPrices>;
  if (rv.error) {
    if (!isBusy(rv)) {
      console.error('mbsx getCoinPrices failed:', rv.error);
    }
    return null;
  }
  return rv;
};

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
  withPendingOutputs(
    request.outputs,
    () =>
      NitroBSX.requestSwap(request) as Promise<
        MbsxResult<{request_id: string}>
      >,
  );

export const getSwapFundingOutputs = (coin: string, amount: string) =>
  NitroBSX.getSwapFundingOutputs(coin, amount) as MbsxResult<{
    outputs?: FundingOutput[];
    total_fee_bps?: number;
    max_fee_bps?: number;
  }>;

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

// True when the core is down: nothing can judge the address then, and
// requestSwap re-checks with the same decoder.
export const validateAddress = (coin: string, address: string): boolean =>
  !isRunning() || NitroBSX.validateAddress(coin, address);

export const acceptOffer = (offerId: string) =>
  NitroBSX.acceptOffer(offerId) as Promise<MbsxResult<{}>>;

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
