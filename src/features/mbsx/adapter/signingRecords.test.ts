import {address as btcAddress} from 'bitcoinjs-lib';

import {recordSigning, signingRecordFor} from './signingRecords';

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
  unlink: jest.fn(async (path: string) => {
    mockFiles.delete(path);
  }),
}));

describe('the signing records', () => {
  it('set an unreadable file aside and start afresh', async () => {
    mockFiles.set('/mbsx/signing.json', '{"request a": {"spend');
    mockFiles.set('/mbsx/signing.json.bad', 'older');
    const prevout = {
      txid: '31'.repeat(32),
      vout: 3,
      amountSat: 500000,
      pkScript: `0014${'cc'.repeat(20)}`,
      leaseId: '',
    };
    await recordSigning(
      'request b',
      [prevout],
      btcAddress.toBech32(Buffer.alloc(20, 0xdd), 0, 'rltc'),
      201000n,
      10n,
    );
    expect(mockFiles.get('/mbsx/signing.json.bad')).toBe(
      '{"request a": {"spend',
    );
    expect(await signingRecordFor([`${'31'.repeat(32)}:3`])).toMatchObject({
      spendSat: '201000',
      feeRate: '10',
    });
  });
});
