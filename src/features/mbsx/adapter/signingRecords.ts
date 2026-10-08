import * as RNFS from '@dr.pogodin/react-native-fs';
import {address as btcAddress} from 'bitcoinjs-lib';

import {MBSX_DATA_DIR} from './config';
import type {FundingOutput, SelectedPrevout} from './prevouts';

// Kept here, not read back from the module: the bound must hold when the module is wrong
export type SigningRecord = {
  // The confirm card's total; beyond it only the chain fee may leave
  spendSat: string;
  changeScript: string;
  inputs: Record<string, string>;
};

const PATH = `${MBSX_DATA_DIR}/signing.json`;

let records: Record<string, SigningRecord> | null = null;
let writing: Promise<void> = Promise.resolve();

const load = async (): Promise<Record<string, SigningRecord>> => {
  if (records === null) {
    records = (await RNFS.exists(PATH))
      ? (JSON.parse(await RNFS.readFile(PATH)) as Record<string, SigningRecord>)
      : {};
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

export const recordSigning = (
  requestId: string,
  prevouts: SelectedPrevout[],
  changeAddress: string,
  outputs: FundingOutput[],
): Promise<void> => {
  const record: SigningRecord = {
    spendSat: outputs
      .reduce((sum, output) => sum + BigInt(output.value), 0n)
      .toString(),
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
