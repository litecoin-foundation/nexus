import * as RNFS from '@dr.pogodin/react-native-fs';

import {fileExists} from '../../../utils/file';
import {getNetwork} from '../network';
import type {LitecoinNetwork} from '../network';

export type VerifyCertsMode = 'none' | 'pinned' | 'optional' | 'strict';

export type ElectrumServer = {
  url: string;
  disabled?: boolean;
  // electrs answers blockchain.transaction.get non-verbose only.
  haveverbosetx?: boolean;
  // Absent means pinned.
  verify_certs_mode?: VerifyCertsMode;
  // Absent means on, matching TlsOptions::verify_hostname; the settings screen
  // renders the switch from that, so the two have to stay in step.
  verify_hostname?: boolean;
};

export type WalletConfig = {
  // 'host' leaves the funding prevouts and their keys on this side; 'debug' has
  // the module own everything. Absent means debug.
  type: 'host' | 'debug';
};

export type CoinConfig = {
  // Absent means disabled.
  enabled?: boolean;
  // Proof of stake chains only, absent means validated.
  verify_pos?: boolean;
  electrumx: ElectrumServer[];
  // Absent means the config's max_electrum_servers.
  max_electrum_servers?: number;
  wallet?: WalletConfig;
};

export type MbsxConfig = {
  config_version?: number;
  chain: LitecoinNetwork;
  debug: boolean;
  bridge_host: string;
  bridge_pubkey: string;
  bridge_port?: number;
  // Absent means the module's default.
  max_fee_bps?: number;
  // Servers kept connected per coin, drawn at random from its list. Absent
  // means the module's default of 2.
  max_electrum_servers?: number;
  // Owned by the Tor switch, which rewrites it on every start; only
  // timeout_seconds survives a hand edit. Absent is a direct connection.
  proxy?: {host: string; port: number; timeout_seconds?: number};
  // Nexus's own; the module ignores keys it does not read.
  revoke_open_requests_on_exit?: boolean;
  show_raw_states?: boolean;
  notify_swaps?: boolean;
  show_debug?: boolean;
  show_utc_times?: boolean;
  coins: Record<string, CoinConfig>;
};

export const CONFIG_VERSION = 2;

// The socks port react-native-nitro-tor listens on, from src/utils/tor.ts.
const TOR_SOCKS_PORT = 9150;

// Nexus's own Tor switch is the only one: a second toggle here could disagree
// with it, and the module would then be the half still in the clear.
export const proxyForTor = (tor_enabled: boolean): MbsxConfig['proxy'] =>
  tor_enabled ? {host: '127.0.0.1', port: TOR_SOCKS_PORT} : undefined;

// What the module's electrum client accepts: tcp or ssl, a host and a port
export const electrumUrlError = (url: string): string => {
  const match =
    /^(tcp|ssl):\/\/(\[[^\]\s]+\]|[^\s:/[\]]+):(\d{1,5})(\/\S*)?$/i.exec(url);
  if (!match) {
    return 'must be tcp://host:port or ssl://host:port';
  }
  const port = Number(match[3]);
  return port >= 1 && port <= 65535 ? '' : 'has a port out of range';
};

export const MBSX_ROOT_DIR = `${RNFS.DocumentDirectoryPath}/mbsx`;
export const MBSX_DATA_DIR = `${MBSX_ROOT_DIR}/${getNetwork()}`;

const CONFIG_PATH = `${MBSX_DATA_DIR}/config.json`;

// Seed values only: written once when no config exists, and never applied over
// one the user has edited. On regtest 10.0.2.2 is the host loopback from the
// emulator, and the ports match test_glueserver.py so the app and the python
// tests share a backend.
const DEFAULTS: Record<LitecoinNetwork, MbsxConfig> = {
  regtest: {
    chain: 'regtest',
    config_version: CONFIG_VERSION,
    debug: true,
    bridge_host: '10.0.2.2',
    bridge_pubkey:
      '0349fcd0a8e2d7e9472e757d34758f61d1980097326dd7823bfd00072717518a49',
    coins: {
      ltc: {
        enabled: true,
        electrumx: [{url: 'tcp://10.0.2.2:50004', haveverbosetx: false}],
        wallet: {type: 'host'},
      },
      btc: {
        enabled: true,
        electrumx: [{url: 'tcp://10.0.2.2:50001'}],
      },
      part: {
        enabled: true,
        electrumx: [{url: 'tcp://10.0.2.2:50007'}],
      },
      firo: {
        enabled: true,
        electrumx: [{url: 'tcp://10.0.2.2:50010'}],
      },
    },
  },
  mainnet: {
    chain: 'mainnet',
    config_version: CONFIG_VERSION,
    debug: false,
    bridge_host: 'wss://glue.basicswapdex.com:9002',
    bridge_pubkey:
      '03f7b229a9733e925745e0df01c8c3e69386a0fc8c165c157ae258a9cc51c1782b',
    coins: {
      ltc: {
        enabled: true,
        electrumx: [
          {url: 'ssl://backup.electrum-ltc.org:443', haveverbosetx: false},
          {url: 'ssl://electrum-ltc.org:50002', haveverbosetx: false},
          {url: 'ssl://electrum1.cipig.net:20063', haveverbosetx: false},
        ],
        wallet: {type: 'host'},
      },
      btc: {
        enabled: true,
        electrumx: [{url: 'ssl://electrum.bitaroo.net:50002'}],
      },
      part: {
        enabled: true,
        electrumx: [{url: 'ssl://178.62.110.5:50002'}],
      },
      firo: {
        electrumx: [{url: 'ssl://electrumx.firo.org:50002'}],
      },
    },
  },
};

export const defaultConfig = (): MbsxConfig => {
  const defaults = DEFAULTS[getNetwork()];
  // Structured clone, so an edit to the returned config cannot reach back into
  // the defaults and change what a later reset restores.
  return JSON.parse(JSON.stringify(defaults));
};

// Version 1's only mainnet ltc server.
const OLD_LTC_DEFAULT = 'ssl://backup.electrum-ltc.org:443';

export const migrateConfig = (config: MbsxConfig): boolean => {
  const version = config.config_version ?? 0;
  if (version >= CONFIG_VERSION) {
    return false;
  }
  // Version 0 read a coin with no enabled flag as on
  if (version < 1) {
    for (const coin of Object.values(config.coins ?? {})) {
      if (coin.enabled === undefined) {
        coin.enabled = true;
      }
    }
  }
  const ltc = config.coins?.ltc;
  if (
    version < 2 &&
    config.chain === 'mainnet' &&
    ltc?.electrumx.length === 1 &&
    ltc.electrumx[0].url === OLD_LTC_DEFAULT
  ) {
    ltc.electrumx = JSON.parse(
      JSON.stringify(DEFAULTS.mainnet.coins.ltc.electrumx),
    );
  }
  config.config_version = CONFIG_VERSION;
  return true;
};

const readStoredConfig = async (): Promise<{
  config: MbsxConfig;
  migrated: boolean;
} | null> => {
  if (!(await fileExists(CONFIG_PATH))) {
    return null;
  }
  try {
    const config: unknown = JSON.parse(await RNFS.readFile(CONFIG_PATH));
    if (
      typeof config !== 'object' ||
      config === null ||
      Array.isArray(config)
    ) {
      throw new Error('not a settings object');
    }
    const settings = config as MbsxConfig;
    return {config: settings, migrated: migrateConfig(settings)};
  } catch (error) {
    console.error('mbsx config is unreadable:', (error as Error).message);
    return null;
  }
};

export const readConfig = async (): Promise<MbsxConfig | null> => {
  const stored = await readStoredConfig();
  if (stored?.migrated) {
    await writeConfig(stored.config);
  }
  return stored?.config ?? null;
};

const writeConfigNow = async (config: MbsxConfig) => {
  if (!(await fileExists(MBSX_DATA_DIR))) {
    await RNFS.mkdir(MBSX_DATA_DIR);
  }
  const tmp = `${CONFIG_PATH}.tmp`;
  await RNFS.writeFile(tmp, JSON.stringify(config, null, 2));
  await RNFS.moveFile(tmp, CONFIG_PATH);
};

let configWrites: Promise<void> = Promise.resolve();

const queueConfigWrite = (write: () => Promise<void>): Promise<void> => {
  const run = configWrites.then(write);
  configWrites = run.catch(() => undefined);
  return run;
};

export const writeConfig = (config: MbsxConfig): Promise<void> =>
  queueConfigWrite(() => writeConfigNow(config));

export const updateConfig = (
  change: (config: MbsxConfig) => MbsxConfig,
): Promise<void> =>
  queueConfigWrite(async () => {
    const stored = await readStoredConfig();
    if (!stored) {
      throw new Error('There are no swap settings to change');
    }
    await writeConfigNow(change(stored.config));
  });

// The module reads config.json once, in initialise(). Anything written here
// takes effect on the next start, not immediately.
// Rewritten on every start rather than merged, since the module reads it once
// and the switch may have moved while the core was down.
export const applyTorSetting = async (
  config: MbsxConfig,
  tor_enabled: boolean,
): Promise<MbsxConfig> => {
  const proxy = proxyForTor(tor_enabled);
  if (proxy && config.proxy?.timeout_seconds !== undefined) {
    proxy.timeout_seconds = config.proxy.timeout_seconds;
  }
  if (JSON.stringify(config.proxy) === JSON.stringify(proxy)) {
    return config;
  }
  const updated = {...config, proxy};
  if (!proxy) {
    delete updated.proxy;
  }
  await writeConfig(updated);
  return updated;
};

export const loadOrCreateConfig = async (): Promise<MbsxConfig> => {
  const existing = await readConfig();
  if (existing) {
    return existing;
  }
  if (await fileExists(CONFIG_PATH)) {
    // moveFile onto an existing file fails on iOS
    if (await fileExists(`${CONFIG_PATH}.bad`)) {
      await RNFS.unlink(`${CONFIG_PATH}.bad`);
    }
    await RNFS.moveFile(CONFIG_PATH, `${CONFIG_PATH}.bad`);
    throw new Error(
      'The swap settings could not be read. They are kept as config.json.bad, and the next start uses the defaults.',
    );
  }
  const config = defaultConfig();
  if (!config.bridge_pubkey) {
    throw new Error(`mbsx has no default config for ${config.chain}`);
  }
  await writeConfig(config);
  return config;
};
