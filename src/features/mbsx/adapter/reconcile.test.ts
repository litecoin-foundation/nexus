import * as RNFS from '@dr.pogodin/react-native-fs';
import NitroBSX from 'react-native-nitro-bsx';

import {
  dismissDispute,
  getInfo,
  installBalanceProvider,
  installSigner,
  readDismissedDisputes,
  reconcileLeases,
  rememberFinishedSwaps,
  start,
} from './index';
import {loadOrCreateConfig, readConfig} from './config';
import {releaseLeases} from './leases';
import {signSwapTx} from './signTx';

jest.mock('react-native-nitro-bsx', () => {
  const fns: Record<string, jest.Mock> = {};
  return {
    __esModule: true,
    default: new Proxy(fns, {
      get: (target, key: string) => (target[key] ??= jest.fn()),
    }),
    startBackgroundService: jest.fn(),
    stopBackgroundService: jest.fn(),
  };
});

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(),
  writeFile: jest.fn(() => Promise.resolve()),
}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

const mockLightning = {lndActive: true};
jest.mock('../../../store', () => ({
  store: {
    getState: () => ({lightning: mockLightning}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
  pStore: {},
}));

jest.mock('../../../utils/tor', () => ({
  canUseTorOnThisDevice: jest.fn(),
  startTor: jest.fn(),
}));

jest.mock('./config', () => ({
  ...jest.requireActual('./config'),
  loadOrCreateConfig: jest.fn(),
  readConfig: jest.fn(),
  writeConfig: jest.fn(() => Promise.resolve()),
}));

jest.mock('./leases', () => ({
  requestIdsWithLocks: jest.fn(() => ['aa']),
  releaseLeases: jest.fn(() => Promise.resolve()),
  releaseOrphanLeases: jest.fn(() => Promise.resolve()),
}));
jest.mock('./prevouts', () => ({}));
jest.mock('./signTx', () => ({
  signSwapTx: jest.fn(() => Promise.resolve('02')),
}));
jest.mock('./signingRecords', () => ({}));
jest.mock('./mainKey', () => ({
  APP_TYPE_NEXUS: 1,
  deriveMainExtkey: jest.fn(() => Promise.resolve('xprv')),
}));
jest.mock('./notify', () => ({notifySwapEnded: jest.fn()}));
jest.mock('./wake', () => ({scheduleWakes: jest.fn()}));

const nitro = NitroBSX as unknown as Record<string, jest.Mock>;

beforeAll(async () => {
  nitro.isRunning.mockReturnValue(true);
  nitro.setDataDir.mockReturnValue(0);
  nitro.setMainExtkey.mockReturnValue(0);
  nitro.listSwaps.mockReturnValue({swaps: []});
  nitro.initialise.mockResolvedValue(0);
  const config = {chain: 'regtest', debug: false, coins: {}} as any;
  (loadOrCreateConfig as jest.Mock).mockResolvedValue(config);
  (readConfig as jest.Mock).mockResolvedValue(config);
  await start();
});

beforeEach(() => {
  (releaseLeases as jest.Mock).mockClear();
});

describe('start', () => {
  it('keeps the mbsx directory out of iOS backups before the core opens it', async () => {
    const mkdir = RNFS.mkdir as jest.Mock;
    mkdir.mockClear();
    nitro.setDataDir.mockClear();
    nitro.isRunning.mockReturnValue(false);
    try {
      await start();
    } finally {
      nitro.isRunning.mockReturnValue(true);
    }
    const excluded = mkdir.mock.calls.findIndex(
      ([path, options]) =>
        path === '/tmp/mbsx' && options?.NSURLIsExcludedFromBackupKey === true,
    );
    expect(excluded).toBeGreaterThanOrEqual(0);
    expect(mkdir.mock.invocationCallOrder[excluded]).toBeLessThan(
      nitro.setDataDir.mock.invocationCallOrder[0],
    );
  });
});

describe('reconcileLeases', () => {
  it('leaves the coins of a request it could not read', async () => {
    for (const error of [
      'The module is starting',
      'Could not open the database',
    ]) {
      nitro.getRequestInfo.mockReturnValue({error});
      await reconcileLeases();
    }
    expect(releaseLeases).not.toHaveBeenCalled();
  });

  it('frees the coins of a request that is gone or has ended', async () => {
    nitro.getRequestInfo.mockReturnValue({error: 'Swap request not found'});
    await reconcileLeases();
    nitro.getRequestInfo.mockReturnValue({state: 'EXPIRED', swapids: []});
    await reconcileLeases();
    expect(releaseLeases).toHaveBeenCalledTimes(2);
  });
});

describe('getInfo', () => {
  it('reads a failed call as nothing known', () => {
    nitro.getInfo.mockImplementation(() => {
      throw new Error('The module is starting');
    });
    expect(getInfo()).toBeNull();
  });
});

describe('the callbacks while lnd is down', () => {
  it('refuse at once to sign or to read a balance', async () => {
    installSigner();
    installBalanceProvider();
    const signCalls = nitro.setSignTx.mock.calls;
    const balanceCalls = nitro.setGetBalance.mock.calls;
    const sign = signCalls[signCalls.length - 1][0];
    const balance = balanceCalls[balanceCalls.length - 1][0];
    mockLightning.lndActive = false;
    try {
      await expect(sign('70736274ff', 'LTC')).resolves.toBe('');
      expect(signSwapTx).not.toHaveBeenCalled();
      await expect(balance('LTC')).rejects.toThrow('lnd is not running');
    } finally {
      mockLightning.lndActive = true;
    }
  });
});

describe('rememberFinishedSwaps', () => {
  it('writes the finished swaps only when they change', async () => {
    const writeFile = RNFS.writeFile as jest.Mock;
    const swap = (id: string) => ({
      id,
      state: 'COMPLETED',
      created_at: `2026-10-08T10:00:0${id.length}`,
    });
    nitro.listSwaps.mockReturnValue({swaps: [swap('a')]});
    writeFile.mockClear();
    await rememberFinishedSwaps();
    await rememberFinishedSwaps();
    expect(writeFile).toHaveBeenCalledTimes(1);
    nitro.listSwaps.mockReturnValue({swaps: [swap('a'), swap('bb')]});
    await rememberFinishedSwaps();
    expect(writeFile).toHaveBeenCalledTimes(2);
  });
});

describe('dismissDispute', () => {
  it('keeps the newest dismissals, each once', async () => {
    const files: Record<string, string> = {};
    (RNFS.writeFile as jest.Mock).mockImplementation(
      async (path: string, data: string) => {
        files[path] = data;
      },
    );
    (RNFS.exists as jest.Mock).mockImplementation(
      async (path: string) => path in files,
    );
    (RNFS.readFile as jest.Mock).mockImplementation(
      async (path: string) => files[path],
    );
    for (let n = 0; n < 25; n++) {
      void dismissDispute(`k${n}`);
    }
    await dismissDispute('k3');
    const keys = await readDismissedDisputes();
    expect(keys).toHaveLength(20);
    expect(keys[0]).toBe('k6');
    expect(keys[19]).toBe('k3');
  });
});
