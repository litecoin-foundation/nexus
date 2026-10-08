import {Transaction} from 'bitcoinjs-lib';
import {walletKitFinalizePsbt} from 'react-native-nitro-lndltc';

import {withDeadline} from './deadline';
import {pendingOutput} from './leases';
import {signingRecordFor} from './signingRecords';

const PSBT_MAGIC = '70736274ff';
const GLOBAL_INPUT_COUNT = 0x04;
const IN_SIGHASH_TYPE = 0x03;
const IN_PREVOUT_HASH = 0x0e;
const IN_PREVOUT_INDEX = 0x0f;
const READ_TYPES = new Set([
  GLOBAL_INPUT_COUNT,
  IN_SIGHASH_TYPE,
  IN_PREVOUT_HASH,
  IN_PREVOUT_INDEX,
]);
const SIGHASH_ALL = 1;
// CoinInterface::OWNERSHIP_PROOF_LOCKTIME
const OWNERSHIP_PROOF_LOCKTIME = 499999999;
// CoinInterface::maxFeeRate(), the module's ceiling on an offer's fee rate
const MAX_FEE_SAT_PER_VBYTE = 1000n;
// Inside HybridNitroBSX's 120 s wait for a signature
const SIGN_MS = 90_000;

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

// lnd parses the full key, so a duplicate or keyed copy could show it another psbt
const readMap = (buf: Buffer, at: number): [PsbtMap, number] => {
  const fields: PsbtMap = new Map();
  const keys = new Set<string>();
  for (;;) {
    let keyLen: number;
    [keyLen, at] = readCompactSize(buf, at);
    if (keyLen === 0) {
      return [fields, at];
    }
    const key = buf.subarray(at, at + keyLen);
    if (key.length !== keyLen) {
      throw new Error('Truncated psbt key');
    }
    at += keyLen;
    let valueLen: number;
    [valueLen, at] = readCompactSize(buf, at);
    const value = buf.subarray(at, at + valueLen);
    if (value.length !== valueLen) {
      throw new Error('Truncated psbt field');
    }
    at += valueLen;
    if (keys.has(key.toString('hex'))) {
      throw new Error('Duplicate psbt key');
    }
    keys.add(key.toString('hex'));
    if (keyLen === 1) {
      fields.set(key[0], Buffer.from(value));
    } else if (READ_TYPES.has(key[0])) {
      throw new Error(`psbt field ${key[0]} carries key data`);
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
    const sighash = input.get(IN_SIGHASH_TYPE);
    if (
      sighash !== undefined &&
      (sighash.length !== 4 || sighash.readUInt32LE(0) !== SIGHASH_ALL)
    ) {
      throw new Error(`psbt input ${i} asks for a sighash other than ALL`);
    }
    outpoints.push(`${hash.toString('hex')}:${index.readUInt32LE(0)}`);
  }
  return outpoints;
};

type SigningScope = {
  values: Map<string, bigint>;
  keep: Set<string>;
  spendSat: bigint;
  feeRate: bigint;
  locktime?: number;
};

const scopeFor = async (outpoints: string[]): Promise<SigningScope> => {
  if (outpoints.length === 0) {
    throw new Error('Refusing to sign a transaction with no inputs');
  }
  const pending = outpoints.map(pendingOutput);
  if (pending.every(output => output !== undefined)) {
    return {
      values: new Map(outpoints.map((key, i) => [key, pending[i]!.valueSat])),
      keep: new Set(pending.map(output => output!.script)),
      spendSat: 0n,
      feeRate: 0n,
      locktime: OWNERSHIP_PROOF_LOCKTIME,
    };
  }
  const record = await signingRecordFor(outpoints);
  if (record === null) {
    throw new Error(
      `Refusing to sign: no one request leased ${outpoints.join(', ')}`,
    );
  }
  return {
    values: new Map(outpoints.map(key => [key, BigInt(record.inputs[key])])),
    keep: new Set([record.changeScript]),
    spendSat: BigInt(record.spendSat),
    feeRate: MAX_FEE_SAT_PER_VBYTE,
  };
};

// Checked on what lnd signed, so no psbt parser's reading of it matters
const checkSigned = (raw: Buffer, outpoints: string[], scope: SigningScope) => {
  const tx = Transaction.fromBuffer(raw);
  const spent = tx.ins.map(
    input => `${Buffer.from(input.hash).toString('hex')}:${input.index}`,
  );
  if (spent.join(',') !== outpoints.join(',')) {
    throw new Error('lnd signed other inputs than the psbt named');
  }
  const total = outpoints.reduce(
    (sum, key) => sum + (scope.values.get(key) ?? 0n),
    0n,
  );
  const kept = tx.outs.reduce(
    (sum, output) =>
      scope.keep.has(Buffer.from(output.script).toString('hex'))
        ? sum + BigInt(output.value)
        : sum,
    0n,
  );
  const allowed = scope.spendSat + scope.feeRate * BigInt(tx.virtualSize());
  if (total - kept > allowed) {
    throw new Error(
      `Refusing to sign: ${total - kept} sat would leave the wallet, at most ${allowed} may`,
    );
  }
  if (scope.locktime !== undefined && tx.locktime !== scope.locktime) {
    throw new Error(`Refusing to sign a proof with locktime ${tx.locktime}`);
  }
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
export const signSwapTx = async (
  psbtHex: string,
  coin: string,
): Promise<string> => {
  if (coin.toUpperCase() !== 'LTC') {
    throw new Error(`Refusing to sign for ${coin}`);
  }
  const outpoints = psbtInputOutpoints(psbtHex);
  const scope = await scopeFor(outpoints);
  const finalized = await withDeadline(
    walletKitFinalizePsbt({fundedPsbt: Buffer.from(psbtHex, 'hex')}),
    'FinalizePsbt',
    SIGN_MS,
  );
  // Length, not truthiness: an empty Uint8Array is truthy, so a zero-length
  // response would pass for a signed transaction.
  if (!finalized?.rawFinalTx?.length) {
    throw new Error('lnd did not finalize the swap transaction');
  }
  const raw = Buffer.from(finalized.rawFinalTx);
  checkSigned(raw, outpoints, scope);
  return raw.toString('hex');
};
