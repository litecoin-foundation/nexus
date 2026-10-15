import * as RNFS from '@dr.pogodin/react-native-fs';

import {fileExists} from '../../../utils/file';
import {
  CONFIG_VERSION,
  MbsxConfig,
  defaultConfig,
  electrumUrlError,
  loadOrCreateConfig,
  migrateConfig,
  readConfig,
  updateConfig,
  writeConfig,
} from './config';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  exists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  moveFile: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({fileExists: jest.fn()}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

const readFile = RNFS.readFile as jest.Mock;
const writeFile = RNFS.writeFile as jest.Mock;
const moveFile = RNFS.moveFile as jest.Mock;
const unlink = RNFS.unlink as jest.Mock;
const exists = fileExists as jest.Mock;

const versionZero = (): MbsxConfig => ({
  chain: 'regtest',
  debug: true,
  bridge_host: '10.0.2.2',
  bridge_pubkey: '02aa',
  coins: {
    ltc: {electrumx: [{url: 'tcp://10.0.2.2:50004'}], wallet: {type: 'host'}},
    btc: {electrumx: [{url: 'tcp://10.0.2.2:50001'}]},
    part: {enabled: false, electrumx: [{url: 'tcp://10.0.2.2:50007'}]},
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  exists.mockResolvedValue(true);
  (RNFS.exists as jest.Mock).mockImplementation((path: string) => exists(path));
});

describe('electrumUrlError', () => {
  it('accepts what the module accepts', () => {
    for (const url of [
      'tcp://host:50001',
      'SSL://electrum.example.org:50002',
      'ssl://[2001:db8::1]:50002',
      'tcp://10.0.2.2:1/path',
    ]) {
      expect(electrumUrlError(url)).toBe('');
    }
  });

  it('refuses what the module would drop', () => {
    for (const url of [
      'tcp://host',
      'host:50001',
      'ws://host:50001',
      'tcp://:50001',
      'tcp://2001:db8::1:50002',
      'tcp://host:50001 ',
      'tcp://host:port',
    ]) {
      expect(electrumUrlError(url)).not.toBe('');
    }
    expect(electrumUrlError('tcp://host:65536')).toBe(
      'has a port out of range',
    );
    expect(electrumUrlError('tcp://host:0')).toBe('has a port out of range');
  });
});

describe('migrateConfig', () => {
  it('keeps a version 0 config’s coins as they were', () => {
    const config = versionZero();
    expect(migrateConfig(config)).toBe(true);
    expect(config.config_version).toBe(CONFIG_VERSION);
    expect(config.coins.ltc.enabled).toBe(true);
    expect(config.coins.btc.enabled).toBe(true);
    expect(config.coins.part.enabled).toBe(false);
  });

  it('leaves a current config alone, so a coin with no flag stays off', () => {
    const config = {...versionZero(), config_version: CONFIG_VERSION};
    expect(migrateConfig(config)).toBe(false);
    expect(config.coins.btc.enabled).toBeUndefined();
  });

  it('extends only the old mainnet ltc default', () => {
    const mainnet = (urls: string[]): MbsxConfig => ({
      ...versionZero(),
      chain: 'mainnet',
      config_version: 1,
      coins: {
        ltc: {
          enabled: true,
          electrumx: urls.map(url => ({url, haveverbosetx: false})),
        },
      },
    });
    const old = mainnet(['ssl://backup.electrum-ltc.org:443']);
    expect(migrateConfig(old)).toBe(true);
    expect(old.coins.ltc.electrumx.map(s => s.url)).toEqual([
      'ssl://backup.electrum-ltc.org:443',
      'ssl://electrum-ltc.org:50002',
      'ssl://electrum1.cipig.net:20063',
    ]);

    const edited = mainnet([
      'ssl://backup.electrum-ltc.org:443',
      'ssl://ltc.example:50002',
    ]);
    expect(migrateConfig(edited)).toBe(true);
    expect(edited.coins.ltc.electrumx).toHaveLength(2);
    expect(edited.coins.ltc.electrumx[1].url).toBe('ssl://ltc.example:50002');

    const regtest = {...versionZero(), config_version: 1};
    expect(migrateConfig(regtest)).toBe(true);
    expect(regtest.coins.ltc.electrumx[0].url).toBe('tcp://10.0.2.2:50004');
  });

  it('has nothing to do for the defaults', () => {
    const config = defaultConfig();
    expect(migrateConfig(config)).toBe(false);
    expect(config.coins.firo.enabled).toBe(true);
  });
});

describe('readConfig', () => {
  it('saves a migrated config', async () => {
    readFile.mockResolvedValue(JSON.stringify(versionZero()));
    const config = await readConfig();
    expect(config?.coins.ltc.enabled).toBe(true);
    expect(writeFile).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(writeFile.mock.calls[0][1]);
    expect(saved.config_version).toBe(CONFIG_VERSION);
    expect(saved.coins.btc.enabled).toBe(true);
  });

  it('does not save a current config', async () => {
    readFile.mockResolvedValue(
      JSON.stringify({...versionZero(), config_version: CONFIG_VERSION}),
    );
    await readConfig();
    expect(writeFile).not.toHaveBeenCalled();
  });
});

describe('the config file', () => {
  const path = '/docs/mbsx/regtest/config.json';

  it('is written beside and renamed into place', async () => {
    await writeConfig(defaultConfig());
    expect(writeFile).toHaveBeenCalledWith(`${path}.tmp`, expect.any(String));
    expect(moveFile).toHaveBeenCalledWith(`${path}.tmp`, path);
  });

  it('is kept aside rather than reset when unreadable', async () => {
    readFile.mockResolvedValue('{"chain": "regt');
    await expect(loadOrCreateConfig()).rejects.toThrow('config.json.bad');
    expect(moveFile).toHaveBeenCalledWith(path, `${path}.bad`);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('is kept aside when it is JSON of the wrong shape', async () => {
    for (const content of ['null', '[]', '"x"']) {
      jest.clearAllMocks();
      readFile.mockResolvedValue(content);
      await expect(loadOrCreateConfig()).rejects.toThrow('config.json.bad');
      expect(unlink).toHaveBeenCalledWith(`${path}.bad`);
      expect(moveFile).toHaveBeenCalledWith(path, `${path}.bad`);
      expect(writeFile).not.toHaveBeenCalled();
    }
  });
});

describe('updateConfig', () => {
  it('changes the stored config in turn with other writes, migrating it in one write', async () => {
    const files: Record<string, string> = {};
    const path = '/docs/mbsx/regtest/config.json';
    exists.mockImplementation(
      async (file: string) => file === '/docs/mbsx/regtest' || file in files,
    );
    readFile.mockImplementation(async (file: string) => files[file]);
    writeFile.mockImplementation(async (file: string, data: string) => {
      files[file] = data;
    });
    moveFile.mockImplementation(async (from: string, to: string) => {
      if (!(from in files)) {
        throw new Error(`ENOENT: ${from}`);
      }
      files[to] = files[from];
      delete files[from];
    });
    try {
      const named = (bridge_host: string) => ({
        ...defaultConfig(),
        bridge_host,
      });
      await Promise.all([
        writeConfig(named('a')),
        writeConfig(named('b')),
        writeConfig(named('c')),
      ]);
      expect(JSON.parse(files[path]).bridge_host).toBe('c');

      await Promise.all([
        writeConfig(named('written')),
        updateConfig(config => ({...config, show_debug: true})),
      ]);
      expect(JSON.parse(files[path])).toMatchObject({
        bridge_host: 'written',
        show_debug: true,
      });

      files[path] = JSON.stringify(versionZero());
      writeFile.mockClear();
      await updateConfig(config => ({...config, notify_swaps: false}));
      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(JSON.parse(files[path])).toMatchObject({
        config_version: CONFIG_VERSION,
        notify_swaps: false,
      });
    } finally {
      [exists, readFile, writeFile, moveFile].forEach(mock => mock.mockReset());
    }
  });
});
