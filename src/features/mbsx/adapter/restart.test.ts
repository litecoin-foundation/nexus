import NitroBSX from 'react-native-nitro-bsx';
import {applyConfig, start} from './index';
import {loadOrCreateConfig, readConfig, writeConfig} from './config';

jest.mock('react-native-nitro-bsx', () => {
  const fns: Record<string, jest.Mock> = {};
  return {
    __esModule: true,
    default: new Proxy(fns, {
      get: (target, key: string) => (target[key] ??= jest.fn()),
    }),
    setBackgroundSwapActive: jest.fn(),
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
jest.mock('./leases', () => ({}));
jest.mock('./prevouts', () => ({}));
jest.mock('./signTx', () => ({}));
jest.mock('./mainKey', () => ({
  APP_TYPE_NEXUS: 1,
  deriveMainExtkey: jest.fn(() => Promise.resolve('xprv')),
}));
jest.mock('./notify', () => ({notifySwapEnded: jest.fn()}));
jest.mock('./wake', () => ({scheduleWakes: jest.fn()}));

const settle = () => new Promise(resolve => setImmediate(resolve));

describe('applyConfig', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('restarts on the new config after a start already in flight', async () => {
    const nitro = NitroBSX as unknown as Record<string, jest.Mock>;
    let running = false;
    let finishFirst: (rv: number) => void = () => {};
    nitro.isRunning.mockImplementation(() => running);
    nitro.setDataDir.mockReturnValue(0);
    nitro.setMainExtkey.mockReturnValue(0);
    nitro.startDebugRpc.mockReturnValue(0);
    nitro.listSwaps.mockReturnValue({swaps: []});
    nitro.stop.mockImplementation(() => {
      running = false;
    });
    nitro.initialise
      .mockImplementationOnce(() =>
        new Promise<number>(resolve => {
          finishFirst = resolve;
        }).then(rv => {
          running = true;
          return rv;
        }),
      )
      .mockImplementation(() => {
        running = true;
        return Promise.resolve(0);
      });
    const config = {chain: 'regtest', debug: false, coins: {}} as any;
    (loadOrCreateConfig as jest.Mock).mockResolvedValue(config);
    (readConfig as jest.Mock).mockResolvedValue(config);

    const first = start();
    await settle();
    expect(nitro.initialise).toHaveBeenCalledTimes(1);

    const saved = applyConfig({...config, debug: true});
    await settle();
    expect(writeConfig).toHaveBeenCalledWith({...config, debug: true});
    expect(nitro.stop).not.toHaveBeenCalled();

    finishFirst(0);
    await first;
    await saved;
    expect(nitro.stop).toHaveBeenCalledTimes(1);
    expect(nitro.initialise).toHaveBeenCalledTimes(2);
  });

  it('runs a second save only after the first has restarted', async () => {
    const nitro = NitroBSX as unknown as Record<string, jest.Mock>;
    let running = false;
    let finishFirst: (rv: number) => void = () => {};
    nitro.isRunning.mockImplementation(() => running);
    nitro.stop.mockImplementation(() => {
      running = false;
    });
    nitro.initialise
      .mockReset()
      .mockImplementationOnce(() =>
        new Promise<number>(resolve => {
          finishFirst = resolve;
        }).then(rv => {
          running = true;
          return rv;
        }),
      )
      .mockImplementation(() => {
        running = true;
        return Promise.resolve(0);
      });
    const config = {chain: 'regtest', debug: false, coins: {}} as any;
    (loadOrCreateConfig as jest.Mock).mockResolvedValue(config);
    (readConfig as jest.Mock).mockResolvedValue(config);
    (writeConfig as jest.Mock).mockClear();

    const first = applyConfig({...config, debug: true});
    const second = applyConfig({...config, debug: false});
    await settle();
    expect(writeConfig).toHaveBeenCalledTimes(1);
    expect(nitro.initialise).toHaveBeenCalledTimes(1);

    finishFirst(0);
    await first;
    await second;
    expect((writeConfig as jest.Mock).mock.calls).toEqual([
      [{...config, debug: true}],
      [{...config, debug: false}],
    ]);
    expect(nitro.initialise).toHaveBeenCalledTimes(2);
  });
});
