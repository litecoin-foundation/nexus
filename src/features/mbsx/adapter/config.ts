import * as RNFS from '@dr.pogodin/react-native-fs';

import {fileExists} from '../../../utils/file';
import {getNetwork} from '../network';
import type {LitecoinNetwork} from '../network';

export type VerifyCertsMode = 'none' | 'pinned' | 'optional' | 'strict';

export type ElectrumServer = {
  url: string;
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
  // Absent means enabled.
  enabled?: boolean;
  electrumx: ElectrumServer[];
  wallet?: WalletConfig;
};

export type MbsxConfig = {
  chain: LitecoinNetwork;
  debug: boolean;
  bridge_host: string;
  bridge_pubkey: string;
  bridge_port?: number;
  // Absent means the module's default.
  max_fee_bps?: number;
  coins: Record<string, CoinConfig>;
};

export const MBSX_DATA_DIR = `${RNFS.DocumentDirectoryPath}/mbsx/${getNetwork()}`;

const CONFIG_PATH = `${MBSX_DATA_DIR}/config.json`;

// Seed values only: written once when no config exists, and never applied over
// one the user has edited. On regtest 10.0.2.2 is the host loopback from the
// emulator, and the ports match test_glueserver.py so the app and the python
// tests share a backend.
const DEFAULTS: Record<LitecoinNetwork, MbsxConfig> = {
  regtest: {
    chain: 'regtest',
    debug: true,
    bridge_host: '10.0.2.2',
    bridge_pubkey:
      '0349fcd0a8e2d7e9472e757d34758f61d1980097326dd7823bfd00072717518a49',
    coins: {
      ltc: {
        electrumx: [{url: 'tcp://10.0.2.2:50004', haveverbosetx: false}],
        wallet: {type: 'host'},
      },
      btc: {
        electrumx: [{url: 'tcp://10.0.2.2:50001'}],
      },
      part: {
        electrumx: [{url: 'tcp://10.0.2.2:50007'}],
      },
    },
  },
  mainnet: {
    chain: 'mainnet',
    debug: false,
    // Local test glue server; production values are not settled yet.
    bridge_host: '10.0.2.2',
    bridge_pubkey:
      '0349fcd0a8e2d7e9472e757d34758f61d1980097326dd7823bfd00072717518a49',
    coins: {
      ltc: {
        electrumx: [
          {url: 'ssl://backup.electrum-ltc.org:443', haveverbosetx: false},
        ],
        wallet: {type: 'host'},
      },
      btc: {
        electrumx: [{url: 'ssl://electrum.bitaroo.net:50002'}],
      },
      part: {
        electrumx: [{url: 'ssl://178.62.110.5:50002'}],
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

export const readConfig = async (): Promise<MbsxConfig | null> => {
  if (!(await fileExists(CONFIG_PATH))) {
    return null;
  }
  try {
    return JSON.parse(await RNFS.readFile(CONFIG_PATH));
  } catch (error) {
    console.error('mbsx config is unreadable:', (error as Error).message);
    return null;
  }
};

export const writeConfig = async (config: MbsxConfig) => {
  if (!(await fileExists(MBSX_DATA_DIR))) {
    await RNFS.mkdir(MBSX_DATA_DIR);
  }
  await RNFS.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
};

// The module reads config.json once, in initialise(). Anything written here
// takes effect on the next start, not immediately.
export const loadOrCreateConfig = async (): Promise<MbsxConfig> => {
  const existing = await readConfig();
  if (existing) {
    return existing;
  }
  const config = defaultConfig();
  if (!config.bridge_pubkey) {
    throw new Error(`mbsx has no default config for ${config.chain}`);
  }
  await writeConfig(config);
  return config;
};
