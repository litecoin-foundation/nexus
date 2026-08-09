import {walletKitFinalizePsbt} from 'react-native-nitro-lndltc';

/**
 * Signs a transaction the module built, over lnd.
 *
 * Nexus holds the funding prevouts and their keys, so the module never asks for
 * a key: it hands over a psbt instead. Returns the signed transaction as hex, or
 * '' to refuse, which the module reports as a failure to sign rather than
 * broadcasting anything.
 *
 * FinalizePsbt signs as well as finalizes, and it is the only route: SignPsbt
 * cannot read a psbt lnd did not write itself, and skips any input without bip32
 * derivation info. Finalizing resolves the key from the prevout script instead,
 * which is all the module's psbt carries.
 *
 * Signing only fills in witnesses, so the txid is unchanged — the module has
 * already recorded it and is watching the chain for it, and it rejects a
 * transaction that comes back with a different one.
 */
export const signSwapTx = async (psbtHex: string): Promise<string> => {
  const finalized = await walletKitFinalizePsbt({
    fundedPsbt: Buffer.from(psbtHex, 'hex'),
  });
  // Length, not truthiness: an empty Uint8Array is truthy, so a zero-length
  // response would pass for a signed transaction.
  if (!finalized?.rawFinalTx?.length) {
    throw new Error('lnd did not finalize the swap transaction');
  }
  return Buffer.from(finalized.rawFinalTx).toString('hex');
};
