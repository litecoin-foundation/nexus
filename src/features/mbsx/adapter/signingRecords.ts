import * as RNFS from '@dr.pogodin/react-native-fs';
import {address as btcAddress} from 'bitcoinjs-lib';

import {MBSX_DATA_DIR} from './config';
import type {FundingOutput, SelectedPrevout} from './prevouts';

// Kept here, not read back from the module: the bound must hold when the module is wrong
export type SigningRecord = {
  // The confirm card's total; beyond it only the chain fee may leave
  spendSat: string;
  // lnd's two block rate when the coins were leased, sats per vbyte
  feeRate: string;
  changeScript: string;
  inputs: Record<string, string>;
};

const PATH = `${MBSX_DATA_DIR}/signing.json`;

let records: Record<string, SigningRecord> | null = null;
let writing: Promise<void> = Promise.resolve();

// Unreadable, it is set aside and started afresh: with no record the signer only refuses
const readRecords = async (): Promise<Record<string, SigningRecord>> => {
  if (!(await RNFS.exists(PATH))) {
    return {};
  }
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(await RNFS.readFile(PATH));
  } catch {
    parsed = null;
  }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, SigningRecord>;
  }
  console.error(`mbsx ${PATH} is unreadable, moving it to ${PATH}.bad`);
  try {
    if (await RNFS.exists(`${PATH}.bad`)) {
      await RNFS.unlink(`${PATH}.bad`);
    }
    await RNFS.moveFile(PATH, `${PATH}.bad`);
  } catch (e) {
    console.warn(`mbsx could not move ${PATH} aside`, e);
  }
  return {};
};

const load = async (): Promise<Record<string, SigningRecord>> => {
  if (records === null) {
    records = await readRecords();
  }
  return records;
};

const update = (
  change: (current: Record<string, SigningRecord>) => void,
): Promise<void> => {
  const next = writing.then(async () => {
    const updated = {...(await load())};
    change(updated);
    if (!(await RNFS.exists(MBSX_DATA_DIR))) {
      await RNFS.mkdir(MBSX_DATA_DIR);
    }
    const tmp = `${PATH}.tmp`;
    await RNFS.writeFile(tmp, JSON.stringify(updated));
    await RNFS.moveFile(tmp, PATH);
    records = updated;
  });
  writing = next.catch(() => undefined);
  return next;
};

const p2wpkhScript = (changeAddress: string): string => {
  const {version, data} = btcAddress.fromBech32(changeAddress);
  if (version !== 0 || data.length !== 20) {
    throw new Error(`Change must be p2wpkh, ${changeAddress} is not`);
  }
  return `0014${Buffer.from(data).toString('hex')}`;
};

// Parsed here, not by the module: the bound must hold when its conversion is wrong
const ltcSats = (amount: string): bigint => {
  const match = /^(\d*)(?:\.(\d{0,8}))?$/.exec(amount.trim());
  if (!match || `${match[1]}${match[2] ?? ''}` === '') {
    throw new Error(`Could not read the amount ${amount}`);
  }
  return (
    BigInt(match[1] || '0') * 100_000_000n +
    BigInt((match[2] ?? '').padEnd(8, '0'))
  );
};

// What the user confirmed: the amount typed and the swap fee the card showed
export const confirmedSpend = (
  outputs: FundingOutput[],
  amount: string,
  cardFeeSat: bigint,
): bigint => {
  const amountSat = ltcSats(amount);
  const lockSat = outputs.length > 0 ? BigInt(outputs[0].value) : 0n;
  if (lockSat !== amountSat) {
    throw new Error(
      `The swap would lock ${lockSat} sat, not the ${amountSat} sat confirmed`,
    );
  }
  const feeSat = outputs
    .slice(1)
    .reduce((sum, output) => sum + BigInt(output.value), 0n);
  if (feeSat > cardFeeSat) {
    throw new Error(
      `The swap fee would be ${feeSat} sat, above the ${cardFeeSat} sat shown`,
    );
  }
  return amountSat + cardFeeSat;
};

export const recordSigning = (
  requestId: string,
  prevouts: SelectedPrevout[],
  changeAddress: string,
  spendSat: bigint,
  feeRate: bigint,
): Promise<void> => {
  const record: SigningRecord = {
    spendSat: spendSat.toString(),
    feeRate: feeRate.toString(),
    changeScript: p2wpkhScript(changeAddress),
    inputs: Object.fromEntries(
      prevouts.map(prevout => [
        `${prevout.txid}:${prevout.vout}`,
        String(prevout.amountSat),
      ]),
    ),
  };
  return update(current => {
    // A coin leased again belongs to this request alone
    for (const [id, other] of Object.entries(current)) {
      if (Object.keys(record.inputs).some(key => key in other.inputs)) {
        delete current[id];
      }
    }
    current[requestId] = record;
  });
};

export const forgetSigning = (requestId: string): Promise<void> =>
  update(current => {
    delete current[requestId];
  });

export const signingRecordFor = async (
  outpoints: string[],
): Promise<SigningRecord | null> => {
  await writing;
  for (const record of Object.values(await load())) {
    if (outpoints.every(key => key in record.inputs)) {
      return record;
    }
  }
  return null;
};
