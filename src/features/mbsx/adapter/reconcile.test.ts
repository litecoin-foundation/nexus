import NitroBSX from 'react-native-nitro-bsx';

import {reconcileLeases, start} from './index';
import {loadOrCreateConfig, readConfig} from './config';
import {releaseLeases} from './leases';

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
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

jest.mock('../../../store', () => ({
  store: {getState: () => ({}), dispatch: jest.fn(), subscribe: jest.fn()},
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
jest.mock('./signTx', () => ({}));
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
