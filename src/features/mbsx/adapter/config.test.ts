import * as RNFS from '@dr.pogodin/react-native-fs';

import {fileExists} from '../../../utils/file';
import {
  CONFIG_VERSION,
  MbsxConfig,
  defaultConfig,
  electrumUrlError,
  migrateConfig,
  readConfig,
} from './config';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({fileExists: jest.fn()}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

const readFile = RNFS.readFile as jest.Mock;
const writeFile = RNFS.writeFile as jest.Mock;
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
