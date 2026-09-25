import {
  ChangeAddressType,
  walletKitFundPsbt,
  walletKitLeaseOutput,
  walletKitListUnspent,
  walletKitReleaseOutput,
} from 'react-native-nitro-lndltc';
import Crypto from 'react-native-quick-crypto';

import {selectedAccountNamesSelector} from '../../../reducers/wallets';
import {store} from '../../../store';

export const LEASE_ID_PREFIX = Buffer.from('mbsx');
// Released when the swap ends; the day only bounds a crash.
export const LEASE_SECONDS = 24 * 60 * 60;

export type FundingOutput = {address: string; value: number};

export type SelectedPrevout = {
  // Hex of lnd's outpoint.txid_bytes: internal byte order, which is both what
  // the module's wire format takes and what ReleaseOutput wants back. Reverse it
  // for anything a human or litecoind's rpc reads - see displayTxid.
  txid: string;
  vout: number;
  amountSat: number;
  pkScript: string;
  // Needed to release the lease when the swap ends.
  leaseId: string;
};

// P2WPKH is 0x00 0x14 followed by the 20 byte key hash. The module signs by
// writing a two element witness and never a scriptSig, so a p2pkh, nested
// segwit, taproot or mweb input would be "signed" into an invalid transaction.
const isP2wpkh = (script: Uint8Array) =>
  script.length === 22 && script[0] === 0x00 && script[1] === 0x14;

// lnd reads min_confs and max_confs together: left at 0/0 it widens max_confs to
// MaxInt32 and returns unconfirmed coins alongside confirmed ones.
const MAX_CONFS = 0x7fffffff;

// Unnamed, lnd lists every account, and one coin it cannot classify fails the
// whole call
const litecoinAccount = (account?: string): string =>
  account ?? selectedAccountNamesSelector(store.getState()).ltcAccount;

const compactSize = (n: number): Buffer => {
  if (n < 0xfd) {
    return Buffer.from([n]);
  }
  const out = Buffer.alloc(3);
  out[0] = 0xfd;
  out.writeUInt16LE(n, 1);
  return out;
};

// The module and lnd both hold a txid in internal byte order; litecoind's rpc
// and a block explorer take it reversed.
export const displayTxid = (txid: string): string =>
  Buffer.from(txid, 'hex').reverse().toString('hex');

/**
 * The module's wire format for a funding output, from its own serialisation:
 * txid[32] internal byte order, vout[4] LE, value[8] LE, compactsize, script.
 *
 * The counterparty's bridge resolves each one with gettxout against its own
 * node, so a txid the wrong way round is rejected there rather than here.
 */
export const serialisePrevout = (prevout: SelectedPrevout): string => {
  const script = Buffer.from(prevout.pkScript, 'hex');
  const head = Buffer.alloc(44);
  Buffer.from(prevout.txid, 'hex').copy(head, 0);
  head.writeUInt32LE(prevout.vout, 32);
  head.writeBigInt64LE(BigInt(prevout.amountSat), 36);
  return Buffer.concat([head, compactSize(script.length), script]).toString(
    'hex',
  );
};

// "txid:vout" of a serialisePrevout output, in the same byte order as leases.
export const serialisedOutpointKey = (output: string): string => {
  const head = Buffer.from(output.slice(0, 72), 'hex');
  return `${head.subarray(0, 32).toString('hex')}:${head.readUInt32LE(32)}`;
};

/**
 * What lnd could fund a swap with right now, in satoshis.
 *
 * The same filter selection uses, and it has to be: a balance counted under
 * looser rules would say a swap is fundable that then fails to select. Leased
 * coins are excluded for free — lnd leaves them out of ListUnspent — so this
 * falls as coins are committed to swaps in flight.
 */
/**
 * What a swap could use now, and what is waiting on a block to join it.
 *
 * One listing rather than two, so the pair cannot come from different moments
 * and disagree.
 */
export const swapBalances = async (
  account?: string,
): Promise<{spendable: bigint; unconfirmed: bigint}> => {
  const {utxos} = await walletKitListUnspent({
    minConfs: 0,
    maxConfs: MAX_CONFS,
    account: litecoinAccount(account),
  });
  let spendable = 0n;
  let unconfirmed = 0n;
  for (const u of utxos ?? []) {
    if (!u.pkScript || !isP2wpkh(Buffer.from(u.pkScript, 'hex'))) {
      continue;
    }
    if (Number(u.confirmations ?? 0) > 0) {
      spendable += BigInt(u.amountSat);
    } else {
      unconfirmed += BigInt(u.amountSat);
    }
  }
  return {spendable, unconfirmed};
};

export const spendableBalance = async (account?: string): Promise<bigint> => {
  const {utxos} = await walletKitListUnspent({
    minConfs: 1,
    maxConfs: MAX_CONFS,
    account: litecoinAccount(account),
  });
  return (utxos ?? []).reduce(
    (total, u) =>
      u.pkScript && isP2wpkh(Buffer.from(u.pkScript, 'hex'))
        ? total + BigInt(u.amountSat)
        : total,
    0n,
  );
};

// lnd refuses its own id to LeaseOutput; one id per request keeps releases apart.
const leaseForSwap = async (
  selected: SelectedPrevout[],
): Promise<SelectedPrevout[]> => {
  const id = Buffer.concat([
    LEASE_ID_PREFIX,
    Buffer.from(Crypto.randomBytes(32 - LEASE_ID_PREFIX.length)),
  ]);
  const held = selected.map(prevout => ({...prevout}));
  const outpoint = (prevout: SelectedPrevout) => ({
    txidBytes: Buffer.from(prevout.txid, 'hex'),
    outputIndex: prevout.vout,
  });
  try {
    for (const prevout of held) {
      await walletKitReleaseOutput({
        id: Buffer.from(prevout.leaseId, 'hex'),
        outpoint: outpoint(prevout),
      });
      prevout.leaseId = '';
      await walletKitLeaseOutput({
        id,
        outpoint: outpoint(prevout),
        expirationSeconds: BigInt(LEASE_SECONDS),
      });
      prevout.leaseId = id.toString('hex');
    }
  } catch (e) {
    for (const prevout of held.filter(p => p.leaseId)) {
      await walletKitReleaseOutput({
        id: Buffer.from(prevout.leaseId, 'hex'),
        outpoint: outpoint(prevout),
      }).catch(() => undefined);
    }
    throw new Error(
      `Could not reserve the swap's coins: ${(e as Error).message}`,
    );
  }
  console.log(`mbsx leased ${held.length} coin(s) for 24h`);
  return held;
};

/**
 * Funds a transaction paying `outputs` and hands back the coins lnd picked and
 * leased; the transaction itself is discarded.
 *
 * The leases must be released when the swap ends, or the coins stay locked out
 * of Nexus's own send flow.
 */
export const selectAndLeasePrevouts = async (
  outputs: FundingOutput[],
  // From isHwWalletSelectedSelector. A parameter rather than a check inside,
  // so selection cannot happen without the question being answered.
  isHardwareWallet: boolean,
  account?: string,
): Promise<SelectedPrevout[]> => {
  // lnd holds no keys for a watch-only account, so it could lease coins here for
  // a transaction nothing can ever sign.
  if (isHardwareWallet) {
    throw new Error('Swaps are not available with a hardware wallet');
  }

  // Before funding, not after: lnd leaves leased outputs out of ListUnspent.
  //
  // Confirmed only - the counterparty's bridge resolves each prevout with
  // gettxout against its own node, which knows nothing of an unconfirmed parent.
  const {utxos} = await walletKitListUnspent({
    minConfs: 1,
    maxConfs: MAX_CONFS,
    account: litecoinAccount(account),
  });
  const byOutpoint = new Map(
    (utxos ?? []).map(u => [
      `${Buffer.from(u.outpoint!.txidBytes).toString('hex')}:${
        u.outpoint!.outputIndex
      }`,
      u,
    ]),
  );

  const funded = await walletKitFundPsbt({
    template: {
      case: 'raw',
      value: {
        outputs: Object.fromEntries(
          outputs.map(o => [o.address, BigInt(o.value)]),
        ),
      },
    },
    // The glue server prices lock tx a at a two block estimate
    fees: {case: 'targetConf', value: 2},
    minConfs: 1,
    spendUnconfirmed: false,
    changeType: ChangeAddressType.UNSPECIFIED,
    account: litecoinAccount(account),
  });

  if (!funded?.lockedUtxos?.length) {
    throw new Error('lnd selected no coins for the swap');
  }

  const selected = funded.lockedUtxos.map(locked => {
    const key = `${Buffer.from(locked.outpoint!.txidBytes).toString('hex')}:${
      locked.outpoint!.outputIndex
    }`;
    const utxo = byOutpoint.get(key);
    if (!utxo?.pkScript) {
      throw new Error(`Leased a coin that is not in the wallet: ${key}`);
    }
    const script = Buffer.from(utxo.pkScript, 'hex');
    if (!isP2wpkh(script)) {
      throw new Error(`Swap funding must be p2wpkh, ${key} is not`);
    }
    return {
      txid: Buffer.from(locked.outpoint!.txidBytes).toString('hex'),
      vout: locked.outpoint!.outputIndex,
      amountSat: Number(utxo.amountSat),
      pkScript: utxo.pkScript,
      leaseId: Buffer.from(locked.id).toString('hex'),
    };
  });

  // Display order: a rejected coin gets checked with gettxout, which takes it
  // the other way round from the wire.
  console.log(
    'mbsx funding:',
    selected
      .map(p => `${displayTxid(p.txid)}:${p.vout} ${p.amountSat}`)
      .join(', '),
  );
  return leaseForSwap(selected);
};
