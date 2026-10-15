import {address as btcAddress} from 'bitcoinjs-lib';

const mockFiles = new Map<string, string>();
let mockFailCommit = false;
let mockFailRead = false;

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  exists: jest.fn(async (path: string) => mockFiles.has(path)),
  mkdir: jest.fn(async () => undefined),
  readFile: jest.fn(async (path: string) => {
    if (mockFailRead) {
      throw new Error('read failed');
    }
    if (!mockFiles.has(path)) {
      throw new Error('ENOENT');
    }
    return mockFiles.get(path);
  }),
  writeFile: jest.fn(async (path: string, content: string) => {
    mockFiles.set(path, content);
  }),
  moveFile: jest.fn(async (from: string, to: string) => {
    if (mockFailCommit && from.endsWith('.tmp')) {
      throw new Error('rename failed');
    }
    if (!mockFiles.has(from) || mockFiles.has(to)) {
      throw new Error('invalid iOS move');
    }
    mockFiles.set(to, mockFiles.get(from)!);
    mockFiles.delete(from);
  }),
  unlink: jest.fn(async (path: string) => mockFiles.delete(path)),
}));

const configPath = '/docs/mbsx/regtest/config.json';
const signingPath = '/docs/mbsx/regtest/signing.json';
const configModule = (): typeof import('./config') => require('./config');
const signingModule = (): typeof import('./signingRecords') =>
  require('./signingRecords');
const prevout = {
  txid: '31'.repeat(32),
  vout: 3,
  amountSat: 500000,
  pkScript: `0014${'cc'.repeat(20)}`,
  leaseId: '',
};
const outpoint = `${prevout.txid}:3`;
const saveRecord = () =>
  signingModule().recordSigning(
    'request',
    [prevout],
    btcAddress.toBech32(Buffer.alloc(20, 0xdd), 0, 'rltc'),
    201000n,
    10n,
  );

beforeEach(() => {
  jest.resetModules();
  mockFiles.clear();
  mockFailCommit = false;
  mockFailRead = false;
});

it('recovers the user configuration after a failed rename and a restart', async () => {
  const config = configModule();
  await config.writeConfig(config.defaultConfig());
  mockFailCommit = true;
  await expect(
    config.updateConfig(current => ({
      ...current,
      bridge_host: 'saved.example',
    })),
  ).rejects.toThrow('rename failed');
  await expect(config.loadOrCreateConfig()).rejects.toThrow('rename failed');
  mockFailCommit = false;
  jest.resetModules();
  expect((await configModule().loadOrCreateConfig()).bridge_host).toBe(
    'saved.example',
  );
});

it('serializes first loads, migrations, reads and concurrent edits', async () => {
  const config = configModule();
  await Promise.all([config.loadOrCreateConfig(), config.loadOrCreateConfig()]);
  const [, observed] = await Promise.all([
    config.updateConfig(current => ({...current, notify_swaps: false})),
    config.readConfig(),
    config.updateConfig(current => ({...current, show_utc_times: true})),
  ]);
  expect(observed?.notify_swaps).toBe(false);
  expect(await config.readConfig()).toMatchObject({
    notify_swaps: false,
    show_utc_times: true,
  });
});

it('does not reset or quarantine valid settings when reading fails', async () => {
  const config = configModule();
  await config.writeConfig(config.defaultConfig());
  const saved = mockFiles.get(configPath);
  mockFailRead = true;
  await expect(config.loadOrCreateConfig()).rejects.toThrow('read failed');
  expect(mockFiles.get(configPath)).toBe(saved);
  expect(mockFiles.has(`${configPath}.bad`)).toBe(false);
});

it('recovers a failed signing-record removal before allowing a cached signature', async () => {
  await saveRecord();
  expect(await signingModule().signingRecordFor([outpoint])).not.toBeNull();
  mockFailCommit = true;
  await expect(signingModule().forgetSigning('request')).rejects.toThrow(
    'rename failed',
  );
  await expect(signingModule().signingRecordFor([outpoint])).rejects.toThrow(
    'rename failed',
  );
  mockFailCommit = false;
  expect(await signingModule().signingRecordFor([outpoint])).toBeNull();
  jest.resetModules();
  expect(await signingModule().signingRecordFor([outpoint])).toBeNull();
});

it('retains newly confirmed signing bounds through a restart after rename failure', async () => {
  mockFailCommit = true;
  await expect(saveRecord()).rejects.toThrow('rename failed');
  mockFailCommit = false;
  jest.resetModules();
  expect(await signingModule().signingRecordFor([outpoint])).toMatchObject({
    spendSat: '201000',
    feeRate: '10',
  });
});

it('serializes signing updates and reads', async () => {
  const [, before, , after] = await Promise.all([
    saveRecord(),
    signingModule().signingRecordFor([outpoint]),
    signingModule().forgetSigning('request'),
    signingModule().signingRecordFor([outpoint]),
  ]);
  expect(before).not.toBeNull();
  expect(after).toBeNull();
});

it('does not restore stale signing permission after quarantining a corrupt primary', async () => {
  await saveRecord();
  await signingModule().forgetSigning('request');
  mockFiles.set(signingPath, '{broken');
  jest.resetModules();
  expect(await signingModule().signingRecordFor([outpoint])).toBeNull();
  jest.resetModules();
  expect(await signingModule().signingRecordFor([outpoint])).toBeNull();
  expect(mockFiles.has(`${signingPath}.bak`)).toBe(false);
});
