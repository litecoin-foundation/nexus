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
import {draftChanged, draftLoaded, draftSaved} from './mbsxSlice';
import {getNetwork} from './network';

export const SETTINGS_ROUTES = [
  'MbsxSettings',
  'ElectrumServers',
  'ElectrumServer',
];

export const persisted = (cfg: MbsxConfig) => {
  const copy = {...cfg};
  delete copy.show_raw_states;
  delete copy.notify_swaps;
  delete copy.show_debug;
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

export const serverHostPort = (
  url: string,
): {host: string; port: number} | null => {
  const match = /^(?:tcp|ssl):\/\/([^:/]+):(\d+)/.exec(url.trim());
  return match ? {host: match[1], port: Number(match[2])} : null;
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

export type DraftProblem = {message: string; coin: string};

export const draftProblem = (config: MbsxConfig): DraftProblem | null => {
  const badCap = (cap?: number) =>
    cap !== undefined && !(Number.isInteger(cap) && cap >= 1);
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
    Alert.alert('Save settings?', warnings.join('\n\n'), [
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
  await applyConfig(config);
  dispatch(draftSaved(persisted(config)));
  return true;
};

export const useUnsavedDraftGuard = (dirty: boolean, route: string) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
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
      Alert.alert('Settings not applied', 'Save to apply your changes.', [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => loadSettingsDraft(dispatch),
        },
        {
          text: 'Keep editing',
          onPress: () => navigation.navigate(route as never),
        },
      ]);
    });
  }, [navigation, dispatch, route]);
};
