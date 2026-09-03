import {
  ChangeAddressType,
  walletKitFundPsbt,
  walletKitListUnspent,
} from 'react-native-nitro-lndltc';

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

/**
 * What lnd could fund a swap with right now, in satoshis.
 *
 * The same filter selection uses, and it has to be: a balance counted under
 * looser rules would say a swap is fundable that then fails to select. Leased
 * coins are excluded for free — lnd leaves them out of ListUnspent — so this
 * falls as coins are committed to swaps in flight.
 */
export const spendableBalance = async (account?: string): Promise<bigint> => {
  const {utxos} = await walletKitListUnspent({
    minConfs: 1,
    maxConfs: MAX_CONFS,
    ...(account ? {account} : {}),
  });
  return (utxos ?? []).reduce(
    (total, u) =>
      u.pkScript && isP2wpkh(Buffer.from(u.pkScript, 'hex'))
        ? total + BigInt(u.amountSat)
        : total,
    0n,
  );
};

/**
 * Asks lnd to fund a transaction paying `outputs`, which selects coins **and
 * leases them**, then hands back what it picked. The transaction itself is
 * discarded: the module builds the real one, so the outputs are the shape it
 * will have rather than its destinations. Leasing is the point, and FundPsbt
 * is the only route to it — liblnd exports ReleaseOutput and ListLeases but no
 * LeaseOutput.
 *
 * The returned leases must be released when the swap ends, or the coins stay
 * locked out of Nexus's own send flow.
 *
 * The lock is best-effort: FundPsbt applies lnd's default duration and offers no
 * way to set one, so on a swap lasting longer the coins silently unlock. Fixing
 * it means binding walletKitLeaseOutput, which takes expiration_seconds and
 * whose protos are already generated.
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

  // Before funding, not after: lnd leaves leased outputs out of ListUnspent, so
  // the value and script would be gone by the time they were needed.
  //
  // Confirmed only, matching the funding call below. A lock tx built on an
  // unconfirmed parent can be orphaned with the swap already in flight, and the
  // counterparty's bridge rejects the prevout outright: it resolves each one
  // with gettxout against its own node, which knows nothing of a parent sitting
  // in ours.
  const {utxos} = await walletKitListUnspent({
    minConfs: 1,
    maxConfs: MAX_CONFS,
    ...(account ? {account} : {}),
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
    ...(account ? {account} : {}),
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
  return selected;
};
