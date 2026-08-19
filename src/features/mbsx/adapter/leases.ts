import {
  walletKitListLeases,
  walletKitReleaseOutput,
} from 'react-native-nitro-lndltc';

import {displayTxid, type SelectedPrevout} from './prevouts';

// Keyed by request id, because that is what is known when the coins are picked:
// a swap id only exists once a counterparty answers, and a request that is never
// answered still holds its leases.
const leased = new Map<string, SelectedPrevout[]>();

export const recordLeases = (
  requestId: string,
  prevouts: SelectedPrevout[],
) => {
  leased.set(requestId, prevouts);
};

export const leasedRequestIds = () => Array.from(leased.keys());

/**
 * The outpoints lnd still has leased, or null when it could not be asked.
 *
 * Null rather than an empty set: not knowing must not be read as "nothing is
 * leased", which would skip every release and leave the coins locked until
 * lnd's own timer lapsed.
 */
const heldOutpoints = async (): Promise<Set<string> | null> => {
  try {
    const leases = await walletKitListLeases({});
    return new Set(
      (leases.lockedUtxos ?? [])
        .filter(u => u.outpoint)
        .map(
          u =>
            `${Buffer.from(u.outpoint!.txidBytes).toString('hex')}:${
              u.outpoint!.outputIndex
            }`,
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
    if (held !== null && !held.has(`${prevout.txid}:${prevout.vout}`)) {
      continue;
    }
    try {
      await walletKitReleaseOutput({
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
 * Safe to call twice: a lease lnd has already expired releases as a no-op, and
 * the entry is dropped either way, since leaving it would retry forever.
 */
export const releaseLeases = async (requestId: string) => {
  const prevouts = leased.get(requestId);
  if (!prevouts) {
    return;
  }
  leased.delete(requestId);
  // A lease vanishing is otherwise indistinguishable from lnd's own timer
  // lapsing, and the two mean very different things about this code.
  console.log(
    `mbsx releasing ${prevouts.length} coin(s) for request ${requestId}`,
  );
  await releasePrevouts(prevouts);
};

export const releaseAllLeases = async () => {
  for (const requestId of leasedRequestIds()) {
    await releaseLeases(requestId);
  }
};
