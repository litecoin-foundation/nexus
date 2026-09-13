import {
  walletKitListLeases,
  walletKitReleaseOutput,
} from 'react-native-nitro-lndltc';
import NitroBSX from 'react-native-nitro-bsx';

import {displayTxid, type SelectedPrevout} from './prevouts';
import {store} from '../../../store';

// Nexus funds every swap from its own LTC wallet; the module records which coin
// each lock is on so a second wallet can be told apart later.
const COIN = 'LTC';

export type WalletLock = {
  coin: string;
  txid: string;
  vout: bigint;
  handle: string;
  request_id: string;
  value: bigint;
  locked_at: bigint;
  released: boolean;
};

const outpointKey = (txid: string, vout: number | bigint) => `${txid}:${vout}`;

const LND_CALL_MS = 30_000;

// nitro-lndltc's calls settle only when lndmobile answers; before lnd starts they never do.
const withDeadline = <T>(call: Promise<T>, what: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error(`${what} did not answer in ${LND_CALL_MS / 1000}s`)),
      LND_CALL_MS,
    );
    call.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const listLeases = () => withDeadline(walletKitListLeases({}), 'ListLeases');

const releaseOutput = (request: Parameters<typeof walletKitReleaseOutput>[0]) =>
  withDeadline(walletKitReleaseOutput(request), 'ReleaseOutput');

/**
 * The locks the module is holding for us, newest first by nothing in
 * particular: it stores the lease id lnd gave us and the request it was taken
 * for, which is the only way to release the right coin on the right request's
 * behalf after a restart.
 */
export const walletLocks = (unreleasedOnly = true): WalletLock[] => {
  const rv = NitroBSX.listWalletLocks(unreleasedOnly) as {
    locks?: WalletLock[];
    error?: string;
  };
  if (rv?.error) {
    console.warn('mbsx could not list wallet locks:', rv.error);
    return [];
  }
  return rv?.locks ?? [];
};

export const recordLeases = (
  requestId: string,
  prevouts: SelectedPrevout[],
) => {
  for (const prevout of prevouts) {
    NitroBSX.recordWalletLock(
      requestId,
      COIN,
      prevout.txid,
      prevout.vout,
      prevout.leaseId,
      BigInt(prevout.amountSat),
    );
  }
};

// Every outpoint still locked for a swap, as "txid:vout" in internal byte order.
export const leasedOutpointKeys = (): Set<string> =>
  new Set(walletLocks().map(lock => outpointKey(lock.txid, lock.vout)));

export const requestIdsWithLocks = (): string[] => [
  ...new Set(walletLocks().map(lock => lock.request_id)),
];

/**
 * The outpoints lnd still has leased, or null when it could not be asked.
 *
 * Null rather than an empty set: not knowing must not be read as "nothing is
 * leased", which would skip every release and leave the coins locked until
 * lnd's own timer lapsed.
 */
const heldOutpoints = async (): Promise<Set<string> | null> => {
  if (!store.getState().lightning.lndActive) {
    console.warn('mbsx lnd is not up, so its leases cannot be read');
    return null;
  }
  try {
    const leases = await listLeases();
    return new Set(
      (leases.lockedUtxos ?? [])
        .filter(u => u.outpoint)
        .map(u =>
          outpointKey(
            Buffer.from(u.outpoint!.txidBytes).toString('hex'),
            u.outpoint!.outputIndex,
          ),
        ),
    );
  } catch (e) {
    console.warn('mbsx could not list leases:', (e as Error).message);
    return null;
  }
};

/**
 * Hands the coins back to Nexus's own send flow. Also the path for coins leased
 * for a request that was never made, which would otherwise stay locked with
 * nothing tracking them.
 */
export const releasePrevouts = async (prevouts: SelectedPrevout[]) => {
  // Ask what lnd still holds first. It drops a lease when the coin is spent, and
  // every swap that published lock tx a has spent them - so releasing blind means
  // a guaranteed `unknown output` rejection per coin on every swap that got that
  // far, which is all of them bar a request that failed before funding.
  const held = await heldOutpoints();

  for (const prevout of prevouts) {
    if (held !== null && !held.has(outpointKey(prevout.txid, prevout.vout))) {
      continue;
    }
    try {
      await releaseOutput({
        id: Buffer.from(prevout.leaseId, 'hex'),
        outpoint: {
          txidBytes: Buffer.from(prevout.txid, 'hex'),
          outputIndex: prevout.vout,
        },
      });
    } catch (e) {
      // Not fatal: the lock expires on its own, so a failure here costs the
      // coins their availability until then rather than losing them.
      console.warn(
        `mbsx could not release ${displayTxid(prevout.txid)}:${prevout.vout}`,
        e,
      );
    }
  }
};

/**
 * Safe to call twice: a lock already marked released is not offered again.
 *
 * The id released is the one recorded when the coin was locked, never the one
 * lnd happens to hold now - a coin this request released and another has since
 * leased would otherwise have the newer request's reservation torn up.
 * A release that fails leaves the row unreleased, so the next pass retries it.
 */
export const releaseLeases = async (requestId: string) => {
  const locks = walletLocks().filter(lock => lock.request_id === requestId);
  if (locks.length === 0) {
    return;
  }
  console.log(`mbsx releasing ${locks.length} lease(s) of ${requestId}`);
  const held = await heldOutpoints();
  if (held === null) {
    return;
  }
  // A coin another request relocked while we awaited is not an error here.
  const markReleased = (lock: WalletLock) => {
    const rv = NitroBSX.markWalletLockReleased(
      requestId,
      lock.coin,
      lock.txid,
      Number(lock.vout),
    ) as {error?: string};
    if (rv?.error) {
      console.warn(
        `mbsx could not mark ${displayTxid(lock.txid)}:${lock.vout} released`,
        rv.error,
      );
    }
  };
  for (const lock of locks) {
    const key = outpointKey(lock.txid, lock.vout);
    if (!held.has(key)) {
      // Spent, or lnd's own timer lapsed: nothing to release, and nothing to
      // retry either.
      markReleased(lock);
      continue;
    }
    try {
      await releaseOutput({
        id: Buffer.from(lock.handle, 'hex'),
        outpoint: {
          txidBytes: Buffer.from(lock.txid, 'hex'),
          outputIndex: Number(lock.vout),
        },
      });
      markReleased(lock);
    } catch (e) {
      console.warn(
        `mbsx could not release ${displayTxid(lock.txid)}:${lock.vout}`,
        e,
      );
    }
  }
};

/**
 * What swaps are holding out of the wallet, in satoshis.
 *
 * Counted against lnd's own leases, so a coin already spent into a lock tx - or
 * one whose lease lapsed on lnd's timer - is not reported as still reserved.
 */
export const reservedBalance = async (): Promise<bigint> => {
  const held = await heldOutpoints();
  if (held === null) {
    return 0n;
  }
  let total = 0n;
  for (const lock of walletLocks()) {
    if (held.has(outpointKey(lock.txid, lock.vout))) {
      total += BigInt(lock.value);
    }
  }
  return total;
};

export const releaseAllLeases = async () => {
  for (const requestId of requestIdsWithLocks()) {
    await releaseLeases(requestId);
  }
};
