import * as RNFS from '@dr.pogodin/react-native-fs';

import {recoverFile, writeRecoverableFile} from './recoverableFile';

const mockFiles = new Map<string, string>();
let mockStopAfter = 0;
let mockOperations = 0;
const mockInterrupted = () => {
  if (++mockOperations === mockStopAfter) {
    throw new Error('process stopped');
  }
};

jest.mock('@dr.pogodin/react-native-fs', () => ({
  exists: jest.fn(async (path: string) => mockFiles.has(path)),
  readFile: jest.fn(async (path: string) => {
    if (!mockFiles.has(path)) {
      throw new Error('ENOENT');
    }
    return mockFiles.get(path);
  }),
  writeFile: jest.fn(async (path: string, content: string) => {
    mockFiles.set(path, content);
    mockInterrupted();
  }),
  moveFile: jest.fn(async (from: string, to: string) => {
    if (!mockFiles.has(from) || mockFiles.has(to)) {
      throw new Error('invalid iOS move');
    }
    mockFiles.set(to, mockFiles.get(from)!);
    mockFiles.delete(from);
    mockInterrupted();
  }),
  unlink: jest.fn(async (path: string) => {
    mockFiles.delete(path);
    mockInterrupted();
  }),
}));

const path = '/settings.json';
const old = '{"value":"old"}';
const next = '{"value":"new"}';

beforeEach(() => {
  mockFiles.clear();
  mockStopAfter = 0;
  mockOperations = 0;
  jest.clearAllMocks();
});

it.each([1, 2, 3, 4])(
  'recovers after filesystem mutation %i during replacement',
  async stop => {
    mockFiles.set(path, old);
    mockFiles.set(`${path}.bak`, '{"value":"older"}');
    mockStopAfter = stop;
    await expect(writeRecoverableFile(path, next)).rejects.toThrow(
      'process stopped',
    );
    mockStopAfter = 0;
    // No in-memory recovery state survives; this is the same operation a new
    // process performs. A present primary wins; otherwise finish the pending write.
    expect(await recoverFile(path)).toBe(true);
    expect(mockFiles.get(path)).toBe(stop < 3 ? old : next);
  },
);

it.each([1, 2])(
  'recovers a first save interrupted after mutation %i',
  async stop => {
    mockStopAfter = stop;
    await expect(writeRecoverableFile(path, next)).rejects.toThrow();
    mockStopAfter = 0;
    expect(await recoverFile(path)).toBe(true);
    expect(mockFiles.get(path)).toBe(next);
  },
);

it('keeps the primary after a partial write and uses the backup if the primary is absent', async () => {
  mockFiles.set(path, old);
  (RNFS.writeFile as jest.Mock).mockImplementationOnce(async (file: string) => {
    mockFiles.set(file, '{"value":');
    throw new Error('disk full');
  });
  await expect(writeRecoverableFile(path, next)).rejects.toThrow('disk full');
  expect(await recoverFile(path)).toBe(true);
  expect(mockFiles.get(path)).toBe(old);
  mockFiles.delete(path);
  mockFiles.set(`${path}.bak`, old);
  expect(await recoverFile(path)).toBe(true);
  expect(mockFiles.get(path)).toBe(old);
});

it('fails closed for an orphaned partial first save', async () => {
  mockFiles.set(`${path}.tmp`, '{"value":');
  await expect(recoverFile(path)).rejects.toThrow('pending file is unreadable');
  expect(mockFiles.has(`${path}.tmp`)).toBe(true);
  expect(mockFiles.has(path)).toBe(false);
});

it('retains recovery files when the rename fails and retries later', async () => {
  mockFiles.set(`${path}.tmp`, next);
  mockFiles.set(`${path}.bak`, old);
  (RNFS.moveFile as jest.Mock).mockRejectedValueOnce(
    new Error('rename failed'),
  );
  await expect(recoverFile(path)).rejects.toThrow('rename failed');
  expect(mockFiles.get(`${path}.tmp`)).toBe(next);
  expect(await recoverFile(path)).toBe(true);
  expect(mockFiles.get(path)).toBe(next);
});

it('propagates a pending-file read error instead of restoring stale data', async () => {
  mockFiles.set(`${path}.tmp`, next);
  mockFiles.set(`${path}.bak`, old);
  (RNFS.readFile as jest.Mock).mockRejectedValueOnce(
    new Error('permission denied'),
  );
  await expect(recoverFile(path)).rejects.toThrow('permission denied');
  expect(mockFiles.has(path)).toBe(false);
});

it('recovers a backup when the pending file is missing', async () => {
  mockFiles.set(`${path}.bak`, old);
  expect(await recoverFile(path)).toBe(true);
  expect(mockFiles.get(path)).toBe(old);
});
