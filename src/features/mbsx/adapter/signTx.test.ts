import {address as btcAddress, Transaction} from 'bitcoinjs-lib';
import {walletKitFinalizePsbt} from 'react-native-nitro-lndltc';

import {withPendingOutputs} from './leases';
import {serialisePrevout} from './prevouts';
import {recordSigning} from './signingRecords';
import {signSwapTx} from './signTx';

jest.mock('react-native-nitro-lndltc', () => ({
  ChangeAddressType: {UNSPECIFIED: 0, P2TR: 1, MWEB: 2},
  walletKitFinalizePsbt: jest.fn(),
  walletKitListLeases: jest.fn(),
  walletKitReleaseOutput: jest.fn(),
}));

jest.mock('react-native-nitro-bsx', () => ({
  __esModule: true,
  default: {listWalletLocks: jest.fn(() => ({locks: []}))},
}));

jest.mock('../../../store', () => ({store: {getState: jest.fn(() => ({}))}}));

jest.mock('../../../reducers/wallets', () => ({
  selectedAccountNamesSelector: jest.fn(() => ({})),
}));

jest.mock('./config', () => ({MBSX_DATA_DIR: '/mbsx'}));

const mockFiles = new Map<string, string>();
jest.mock('@dr.pogodin/react-native-fs', () => ({
  exists: jest.fn(
    async (path: string) => path === '/mbsx' || mockFiles.has(path),
  ),
  mkdir: jest.fn(async () => undefined),
  readFile: jest.fn(async (path: string) => mockFiles.get(path)),
  writeFile: jest.fn(async (path: string, data: string) => {
    mockFiles.set(path, data);
  }),
  moveFile: jest.fn(async (from: string, to: string) => {
    mockFiles.set(to, mockFiles.get(from)!);
    mockFiles.delete(from);
  }),
}));

const finalizePsbt = walletKitFinalizePsbt as jest.Mock;

type In = {txid: string; vout: number; sighash?: number; extra?: Buffer[]};
type Out = {value: bigint; script: string};

const field = (key: Buffer, value: Buffer) =>
  Buffer.concat([
    Buffer.from([key.length]),
    key,
    Buffer.from([value.length]),
    value,
  ]);
const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const u64 = (n: bigint) => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(n);
  return b;
};

// As the module's makePsbtV2 lays one out
const psbtV2 = (ins: In[], outs: Out[]) => {
  const end = Buffer.from([0]);
  const parts: Buffer[] = [
    Buffer.from('70736274ff', 'hex'),
    field(Buffer.from([0xfb]), u32(2)),
    field(Buffer.from([0x02]), u32(2)),
    field(Buffer.from([0x04]), Buffer.from([ins.length])),
    field(Buffer.from([0x05]), Buffer.from([outs.length])),
    end,
  ];
  for (const input of ins) {
    parts.push(
      field(Buffer.from([0x0e]), Buffer.from(input.txid, 'hex')),
      field(Buffer.from([0x0f]), u32(input.vout)),
    );
    if (input.sighash !== undefined) {
      parts.push(field(Buffer.from([0x03]), u32(input.sighash)));
    }
    parts.push(...(input.extra ?? []), end);
  }
  for (const output of outs) {
    parts.push(
      field(Buffer.from([0x03]), u64(output.value)),
      field(Buffer.from([0x04]), Buffer.from(output.script, 'hex')),
      end,
    );
  }
  return Buffer.concat(parts).toString('hex');
};

const signedTx = (ins: In[], outs: Out[], locktime = 0) => {
  const tx = new Transaction();
  tx.version = 2;
  tx.locktime = locktime;
  ins.forEach(input =>
    tx.addInput(Buffer.from(input.txid, 'hex'), input.vout, 0xfffffffe),
  );
  outs.forEach(output =>
    tx.addOutput(Buffer.from(output.script, 'hex'), Number(output.value)),
  );
  ins.forEach((_, n) =>
    tx.setWitness(n, [Buffer.alloc(72, 1), Buffer.alloc(33, 2)]),
  );
  return new Uint8Array(tx.toBuffer());
};

const OWN = `0014${'cc'.repeat(20)}`;
const CHANGE = `0014${'dd'.repeat(20)}`;
const CHANGE_ADDRESS = btcAddress.toBech32(Buffer.alloc(20, 0xdd), 0, 'rltc');
const LOCK = `0020${'bb'.repeat(32)}`;
const FEE = `0014${'aa'.repeat(20)}`;

const prevout = (byte: string, amountSat = 500000) => ({
  txid: byte.repeat(32),
  vout: 3,
  amountSat,
  pkScript: OWN,
  leaseId: '',
});

const funding = [
  {address: 'lock', value: 200000},
  {address: 'fee', value: 1000},
];

const lockOuts = (change: bigint): Out[] => [
  {value: 200000n, script: LOCK},
  {value: 1000n, script: FEE},
  {value: change, script: CHANGE},
];

const signs = (ins: In[], outs: Out[], locktime = 0) => {
  finalizePsbt.mockResolvedValue({rawFinalTx: signedTx(ins, outs, locktime)});
  return signSwapTx(psbtV2(ins, outs), 'LTC');
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('the ownership proof', () => {
  const input = {txid: '11'.repeat(32), vout: 3, sighash: 1};
  const proof: Out[] = [
    {value: 0n, script: `6a20${'ee'.repeat(32)}`},
    {value: 500000n, script: OWN},
  ];
  const output = serialisePrevout(prevout('11'));

  it('signs while the request is built, and not before or after', async () => {
    await expect(signs([input], proof, 499999999)).rejects.toThrow(
      'no one request leased',
    );
    await withPendingOutputs([output], async () => {
      await expect(signs([input], proof, 499999999)).resolves.toMatch(/^02/);
    });
    await expect(signs([input], proof, 499999999)).rejects.toThrow(
      'no one request leased',
    );
  });

  it('stops signing when the request fails', async () => {
    await expect(
      withPendingOutputs([output], async () => {
        throw new Error('send failed');
      }),
    ).rejects.toThrow('send failed');
    await expect(signs([input], proof, 499999999)).rejects.toThrow(
      'no one request leased',
    );
  });

  it('must pay everything back and never confirm', async () => {
    await withPendingOutputs([output], async () => {
      await expect(
        signs([input], [proof[0], {value: 500000n, script: FEE}], 499999999),
      ).rejects.toThrow('500000 sat would leave the wallet, at most 0 may');
      await expect(signs([input], proof, 0)).rejects.toThrow('locktime 0');
    });
  });
});

describe('a swap transaction', () => {
  it('signs the lock, its fees and change back', async () => {
    await recordSigning('request a', [prevout('21')], CHANGE_ADDRESS, funding);
    const ins = [{txid: '21'.repeat(32), vout: 3, sighash: 1}];
    await expect(signs(ins, lockOuts(297000n))).resolves.toMatch(/^02/);
  });

  it('refuses to send the change anywhere else', async () => {
    await recordSigning('request b', [prevout('22')], CHANGE_ADDRESS, funding);
    const ins = [{txid: '22'.repeat(32), vout: 3}];
    await expect(signs(ins, lockOuts(50000n))).rejects.toThrow(
      'would leave the wallet',
    );
    await expect(
      signs(ins, [...lockOuts(0n).slice(0, 2), {value: 297000n, script: FEE}]),
    ).rejects.toThrow('would leave the wallet');
  });

  it("spends one request's coins only", async () => {
    await recordSigning('request c', [prevout('23')], CHANGE_ADDRESS, funding);
    await recordSigning('request d', [prevout('24')], CHANGE_ADDRESS, funding);
    const ins = [
      {txid: '23'.repeat(32), vout: 3},
      {txid: '24'.repeat(32), vout: 3},
    ];
    await expect(signs(ins, lockOuts(797000n))).rejects.toThrow(
      'no one request leased',
    );
    expect(finalizePsbt).not.toHaveBeenCalled();
  });

  it('refuses another sighash, a duplicated key, or another coin', async () => {
    await recordSigning('request e', [prevout('25')], CHANGE_ADDRESS, funding);
    const txid = '25'.repeat(32);
    await expect(
      signs([{txid, vout: 3, sighash: 0x82}], lockOuts(297000n)),
    ).rejects.toThrow('sighash other than ALL');
    const again = field(
      Buffer.from([0x0e]),
      Buffer.from('26'.repeat(32), 'hex'),
    );
    await expect(
      signs([{txid, vout: 3, extra: [again]}], lockOuts(297000n)),
    ).rejects.toThrow('Duplicate psbt key');
    await expect(
      signSwapTx(psbtV2([{txid, vout: 3}], lockOuts(297000n)), 'BTC'),
    ).rejects.toThrow('Refusing to sign for BTC');
    expect(finalizePsbt).not.toHaveBeenCalled();
  });

  it('gives up when lnd never signs', async () => {
    await recordSigning('request g', [prevout('29')], CHANGE_ADDRESS, funding);
    jest.useFakeTimers();
    try {
      finalizePsbt.mockReturnValue(new Promise(() => {}));
      const signing = signSwapTx(
        psbtV2([{txid: '29'.repeat(32), vout: 3}], lockOuts(297000n)),
        'LTC',
      );
      const settled = expect(signing).rejects.toThrow(
        'FinalizePsbt did not answer in 90s',
      );
      await jest.advanceTimersByTimeAsync(90_000);
      await settled;
    } finally {
      jest.useRealTimers();
    }
  });

  it('checks what lnd signed, not just the psbt', async () => {
    await recordSigning('request f', [prevout('27')], CHANGE_ADDRESS, funding);
    const ins = [{txid: '27'.repeat(32), vout: 3}];
    finalizePsbt.mockResolvedValue({
      rawFinalTx: signedTx(
        [{txid: '28'.repeat(32), vout: 3}],
        lockOuts(297000n),
      ),
    });
    await expect(
      signSwapTx(psbtV2(ins, lockOuts(297000n)), 'LTC'),
    ).rejects.toThrow('lnd signed other inputs');
    finalizePsbt.mockResolvedValue({
      rawFinalTx: signedTx(ins, lockOuts(50000n)),
    });
    await expect(
      signSwapTx(psbtV2(ins, lockOuts(297000n)), 'LTC'),
    ).rejects.toThrow('would leave the wallet');
  });
});
