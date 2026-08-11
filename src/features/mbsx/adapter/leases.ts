import {walletKitReleaseOutput} from 'react-native-nitro-lndltc';

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
 * Hands the coins back to Nexus's own send flow. Also the path for coins leased
 * for a request that was never made, which would otherwise stay locked with
 * nothing tracking them.
 */
export const releasePrevouts = async (prevouts: SelectedPrevout[]) => {
  for (const prevout of prevouts) {
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
