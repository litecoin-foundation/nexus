import {walletKitFinalizePsbt} from 'react-native-nitro-lndltc';

import {leasedOutpointKeys} from './leases';

const PSBT_MAGIC = '70736274ff';
const GLOBAL_INPUT_COUNT = 0x04;
const IN_PREVOUT_HASH = 0x0e;
const IN_PREVOUT_INDEX = 0x0f;

const readCompactSize = (buf: Buffer, at: number): [number, number] => {
  const first = buf.readUInt8(at);
  if (first < 0xfd) {
    return [first, at + 1];
  }
  if (first === 0xfd) {
    return [buf.readUInt16LE(at + 1), at + 3];
  }
  if (first === 0xfe) {
    return [buf.readUInt32LE(at + 1), at + 5];
  }
  throw new Error('Outpoint count over 32 bits');
};

type PsbtMap = Map<number, Buffer>;

// Fields keyed by type alone, as makePsbtV2 writes them; a keyed field's
// extra key data is ignored rather than modelled.
const readMap = (buf: Buffer, at: number): [PsbtMap, number] => {
  const fields: PsbtMap = new Map();
  for (;;) {
    let keyLen: number;
    [keyLen, at] = readCompactSize(buf, at);
    if (keyLen === 0) {
      return [fields, at];
    }
    const keyType = buf.readUInt8(at);
    at += keyLen;
    let valueLen: number;
    [valueLen, at] = readCompactSize(buf, at);
    const value = buf.subarray(at, at + valueLen);
    if (value.length !== valueLen) {
      throw new Error('Truncated psbt field');
    }
    at += valueLen;
    if (!fields.has(keyType)) {
      fields.set(keyType, Buffer.from(value));
    }
  }
};

/**
 * The outpoints a psbt v2 spends, as "txid:vout" in internal byte order.
 * Parsed here, not asked of the module: the containment below is only worth
 * having if it does not trust the thing it contains.
 */
export const psbtInputOutpoints = (psbtHex: string): string[] => {
  const buf = Buffer.from(psbtHex, 'hex');
  if (
    buf.length < 5 ||
    buf.subarray(0, 5).toString('hex') !== PSBT_MAGIC ||
    psbtHex.length !== buf.length * 2
  ) {
    throw new Error('Not a psbt');
  }
  let at = 5;
  let globals: PsbtMap;
  [globals, at] = readMap(buf, at);
  const inputCountField = globals.get(GLOBAL_INPUT_COUNT);
  if (!inputCountField) {
    throw new Error('psbt has no input count');
  }
  const [inputCount] = readCompactSize(inputCountField, 0);
  const outpoints: string[] = [];
  for (let i = 0; i < inputCount; i++) {
    let input: PsbtMap;
    [input, at] = readMap(buf, at);
    const hash = input.get(IN_PREVOUT_HASH);
    const index = input.get(IN_PREVOUT_INDEX);
    if (hash?.length !== 32 || index?.length !== 4) {
      throw new Error(`psbt input ${i} has no outpoint`);
    }
    outpoints.push(`${hash.toString('hex')}:${index.readUInt32LE(0)}`);
  }
  return outpoints;
};

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
  // Caps a module fault at the leased amounts: lnd signs any input it holds
  // keys for, so the psbt must spend nothing this app did not lease for swaps.
  const held = leasedOutpointKeys();
  for (const outpoint of psbtInputOutpoints(psbtHex)) {
    if (!held.has(outpoint)) {
      throw new Error(`Refusing to sign for unleased output ${outpoint}`);
    }
  }
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
