import {useCallback, useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useStore} from 'react-redux';

import type {AppDispatch, RootState} from '../../store';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  applyConfig,
  defaultConfig,
  electrumUrlError,
  readConfig,
} from './adapter';
import type {ElectrumServer, MbsxConfig, VerifyCertsMode} from './adapter';
import {draftChanged, draftLoaded, draftSaved, setError} from './mbsxSlice';
import {getNetwork} from './network';

export const SETTINGS_ROUTES = [
  'MbsxSettings',
  'ElectrumServers',
  'ElectrumServer',
  'CoinRateServices',
];

export const persisted = (cfg: MbsxConfig) => {
  const copy = {...cfg};
  delete copy.show_raw_states;
  delete copy.notify_swaps;
  delete copy.show_debug;
  delete copy.show_utc_times;
  return JSON.stringify(copy);
};

// The module refuses verify_certs_mode none off regtest
const normaliseModes = (
  cfg: MbsxConfig,
): {config: MbsxConfig; coerced: boolean} => {
  if (getNetwork() === 'regtest') {
    return {config: cfg, coerced: false};
  }
  let coerced = false;
  const coins = Object.fromEntries(
    Object.entries(cfg.coins).map(([coin, settings]) => [
      coin,
      {
        ...settings,
        electrumx: settings.electrumx.map(server => {
          if (server.verify_certs_mode !== 'none') {
            return server;
          }
          coerced = true;
          return {...server, verify_certs_mode: 'pinned' as VerifyCertsMode};
        }),
      },
    ]),
  ) as MbsxConfig['coins'];
  return {config: {...cfg, coins}, coerced};
};

// True when certificate checking had to be turned back on
export const loadSettingsDraft = async (dispatch: AppDispatch) => {
  const stored = (await readConfig()) ?? defaultConfig();
  const {config, coerced} = normaliseModes(stored);
  dispatch(
    draftLoaded({
      config,
      savedJson: persisted(config),
      storedJson: persisted(stored),
    }),
  );
  return coerced;
};

export const useSettingsDraft = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const config = useAppSelector(state => state.mbsx.settingsDraft);
  const savedJson = useAppSelector(state => state.mbsx.settingsSavedJson);
  const setConfig = useCallback(
    (update: (prev: MbsxConfig) => MbsxConfig) => {
      const prev = store.getState().mbsx.settingsDraft;
      if (prev) {
        dispatch(draftChanged(update(prev)));
      }
    },
    [dispatch, store],
  );
  const dirty =
    config !== null && savedJson !== null && persisted(config) !== savedJson;
  return {config, setConfig, dirty};
};

export const changedElsewhere = async (storedJson: string | null) =>
  storedJson !== null &&
  persisted((await readConfig()) ?? defaultConfig()) !== storedJson;

export const editServer = (
  cfg: MbsxConfig,
  coin: string,
  index: number,
  patch: Partial<ElectrumServer>,
): MbsxConfig => ({
  ...cfg,
  coins: {
    ...cfg.coins,
    [coin]: {
      ...cfg.coins[coin],
      electrumx: cfg.coins[coin].electrumx.map((server, i) =>
        i === index ? {...server, ...patch} : server,
      ),
    },
  },
});

export const addServer = (cfg: MbsxConfig, coin: string): MbsxConfig => ({
  ...cfg,
  coins: {
    ...cfg.coins,
    [coin]: {
      ...cfg.coins[coin],
      electrumx: [...cfg.coins[coin].electrumx, {url: ''}],
    },
  },
});

export const removeServer = (
  cfg: MbsxConfig,
  coin: string,
  index: number,
): MbsxConfig => ({
  ...cfg,
  coins: {
    ...cfg.coins,
    [coin]: {
      ...cfg.coins[coin],
      electrumx: cfg.coins[coin].electrumx.filter((_, i) => i !== index),
    },
  },
});

export const editCoinCap = (
  cfg: MbsxConfig,
  coin: string,
  text: string,
): MbsxConfig => ({
  ...cfg,
  coins: {
    ...cfg.coins,
    [coin]: {
      ...cfg.coins[coin],
      max_electrum_servers: text ? Number(text) : undefined,
    },
  },
});

// An ipv6 host comes back without its brackets, the form the module keys
// certificates by.
export const serverHostPort = (
  url: string,
): {host: string; port: number} | null => {
  const trimmed = url.trim();
  if (electrumUrlError(trimmed) !== '') {
    return null;
  }
  const match = /^(?:tcp|ssl):\/\/(?:\[([^\]]+)\]|([^:/]+)):(\d+)/i.exec(
    trimmed,
  );
  return match ? {host: match[1] ?? match[2], port: Number(match[3])} : null;
};

export type ServerRow = {
  url: string;
  state: 'active' | 'idle' | 'cooldown';
  live: boolean;
  error: string;
  version?: string;
};

export const serverStateLabel = (server: ElectrumServer, row?: ServerRow) => {
  if (server.disabled) {
    return 'Disabled';
  }
  if (!row) {
    return 'Not started';
  }
  if (row.state === 'cooldown') {
    return 'Cooling down';
  }
  if (row.state === 'idle') {
    return 'Standby';
  }
  return row.live ? 'Connected' : 'Connecting';
};

export const serverErrorLabel = (error: string) =>
  error === 'connect failed' ? 'Connect failed' : error;

export type DraftProblem = {message: string; coin: string};

// BSXModule::initialise takes ws:// or wss://, or a bare host it reaches over plain ws
const bridgeHostError = (host: string): string | null => {
  const trimmed = host.trim();
  if (!trimmed) {
    return 'is empty';
  }
  if (trimmed.includes('://')) {
    return /^wss?:\/\/\S+$/i.test(trimmed)
      ? null
      : 'must start wss:// or ws://';
  }
  return /^[^\s/:]+$/.test(trimmed) ? null : 'must be wss://host:port';
};

export const draftProblem = (config: MbsxConfig): DraftProblem | null => {
  const badCap = (cap?: number) =>
    cap !== undefined && !(Number.isInteger(cap) && cap >= 1);
  if (!/^0[23][0-9a-fA-F]{64}$/.test(config.bridge_pubkey ?? '')) {
    return {
      message:
        'The swap server pubkey must be 66 hex characters starting 02 or 03',
      coin: '',
    };
  }
  const hostError = bridgeHostError(config.bridge_host ?? '');
  if (hostError) {
    return {message: `The swap server address ${hostError}`, coin: ''};
  }
  const port = config.bridge_port;
  if (
    port !== undefined &&
    !(Number.isInteger(port) && port >= 1 && port <= 65535)
  ) {
    return {
      message: 'The swap server port must be a whole number from 1 to 65535',
      coin: '',
    };
  }
  if (badCap(config.max_electrum_servers)) {
    return {
      message: 'Servers kept connected must be a whole number, at least 1',
      coin: '',
    };
  }
  for (const [coin, settings] of Object.entries(config.coins)) {
    if (settings.enabled !== true) {
      continue;
    }
    if (badCap(settings.max_electrum_servers)) {
      return {
        message: `Servers kept connected for ${coin} must be a whole number, at least 1`,
        coin,
      };
    }
    if (settings.electrumx.some(server => !server.url.trim())) {
      return {message: `Empty server url for ${coin}`, coin};
    }
    const bad = settings.electrumx.find(server => electrumUrlError(server.url));
    if (bad) {
      return {
        message: `Server url ${bad.url} for ${coin} ${electrumUrlError(bad.url)}`,
        coin,
      };
    }
  }
  return null;
};

export const draftWarnings = async (
  config: MbsxConfig,
  storedJson: string | null,
) => {
  const warnings: string[] = [];
  const unserved = Object.entries(config.coins)
    .filter(
      ([, settings]) =>
        settings.enabled === true &&
        !settings.electrumx.some(server => !server.disabled),
    )
    .map(([coin]) => coin);
  if (unserved.length > 0) {
    warnings.push(
      `${unserved.join(', ')} has no enabled server, so the app can't watch it.`,
    );
  }
  const stored = storedJson ? (JSON.parse(storedJson) as MbsxConfig) : null;
  if (stored && stored.bridge_pubkey !== config.bridge_pubkey) {
    warnings.push(
      'This changes which swap server the app trusts. Use only a server you run or know.',
    );
  }
  if (
    config.chain === 'mainnet' &&
    stored?.bridge_host !== config.bridge_host &&
    !/^wss:\/\//i.test(config.bridge_host.trim())
  ) {
    warnings.push(
      'The swap server is not reached over wss://, so the connection is unencrypted: ' +
        'anyone on the network path can see when this wallet uses it, and delay or drop its messages.',
    );
  }
  if (config.chain === 'mainnet') {
    const storedUrls = new Set(
      Object.values(stored?.coins ?? {}).flatMap(coin =>
        coin.electrumx.map(server => server.url),
      ),
    );
    const plain = Object.values(config.coins)
      .filter(coin => coin.enabled === true)
      .flatMap(coin => coin.electrumx)
      .filter(
        server =>
          !server.disabled &&
          /^tcp:\/\//i.test(server.url) &&
          !storedUrls.has(server.url),
      )
      .map(server => server.url);
    if (plain.length > 0) {
      warnings.push(
        `${plain.join(', ')} is reached over plain tcp://: anyone on the network path ` +
          'can see which addresses this wallet watches, or pose as the server. ssl:// avoids both.',
      );
    }
  }
  if (await changedElsewhere(storedJson)) {
    warnings.push(
      'The settings were changed outside this screen since it loaded them, ' +
        'for example by the server banner, and saving replaces those changes.',
    );
  }
  return warnings;
};

const confirmSave = (warnings: string[]) =>
  new Promise<boolean>(resolve =>
    Alert.alert('Save Settings?', warnings.join('\n\n'), [
      {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
      {text: 'Save', onPress: () => resolve(true)},
    ]),
  );

// False when nothing was applied
export const saveSettingsDraft = async (
  config: MbsxConfig,
  storedJson: string | null,
  dispatch: AppDispatch,
  onProblem: (problem: DraftProblem) => void,
) => {
  const problem = draftProblem(config);
  if (problem) {
    onProblem(problem);
    return false;
  }
  const warnings = await draftWarnings(config, storedJson);
  if (warnings.length > 0 && !(await confirmSave(warnings))) {
    return false;
  }
  dispatch(setError(null));
  try {
    await applyConfig(config);
  } catch (e) {
    dispatch(setError((e as Error).message));
    throw e;
  }
  dispatch(draftSaved(persisted(config)));
  return true;
};

export const useUnsavedDraftGuard = (
  dirty: boolean,
  route: string,
  onDiscard?: () => void,
) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const discardRef = useRef(onDiscard);
  discardRef.current = onDiscard;
  useEffect(() => {
    return navigation.addListener('blur', () => {
      if (!dirtyRef.current) {
        return;
      }
      const state = navigation.getState?.();
      const focused = state?.routes[state.index]?.name;
      if (focused && SETTINGS_ROUTES.includes(focused)) {
        return;
      }
      Alert.alert('Settings Not Applied', 'Save to apply your changes.', [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () =>
            discardRef.current
              ? discardRef.current()
              : loadSettingsDraft(dispatch),
        },
        {
          text: 'Keep Editing',
          onPress: () => navigation.navigate(route as never),
        },
      ]);
    });
  }, [navigation, dispatch, route]);
};
