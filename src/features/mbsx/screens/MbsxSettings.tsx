import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {setRunning} from '../mbsxSlice';
import {
  addCaCert,
  applyConfig,
  coinsWithActiveSwaps,
  getInfo,
  defaultConfig,
  isRunning,
  listCaCerts,
  readConfig,
  removeCaCert,
  writeConfig,
} from '../adapter';
import type {
  CaCert,
  ElectrumServer,
  MbsxConfig,
  VerifyCertsMode,
} from '../adapter';
import {getNetwork} from '../network';

// none is refused off regtest by the module, so it is not offered there.
const ALL_MODES: VerifyCertsMode[] = ['none', 'pinned', 'optional', 'strict'];

const POS_COINS = ['part'];

// Only these validate a chain, so only these have anchors or a hostname to
// check: under none and pinned mbedtls performs no name check at all.
const chainsChecked = (server: ElectrumServer) =>
  server.verify_certs_mode === 'optional' ||
  server.verify_certs_mode === 'strict';

const MbsxSettings: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const [config, setConfig] = useState<MbsxConfig | null>(null);
  // Read-only here: Nexus owns the switch, and a second one could disagree.
  const torEnabled = useAppSelector(state => state.settings.torEnabled);
  const [activeCoins, setActiveCoins] = useState<Set<string> | null>(null);
  // Null while the core is stopped, which shows every coin in the config.
  const [compiledCoins, setCompiledCoins] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  // A coin-scoped error renders inside that coin's block. At the foot of the
  // screen, next to Save, it is off screen for whichever coin was pressed.
  const [errorCoin, setErrorCoin] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [certs, setCerts] = useState<CaCert[]>([]);
  const [certLabel, setCertLabel] = useState('');
  const [certHost, setCertHost] = useState('');
  const [certPort, setCertPort] = useState('');
  const [certPem, setCertPem] = useState('');

  const modes =
    getNetwork() === 'regtest'
      ? ALL_MODES
      : ALL_MODES.filter(mode => mode !== 'none');

  const fail = (message: string, coin = '') => {
    setError(message);
    setErrorCoin(coin);
  };

  const loadCerts = useCallback(() => {
    try {
      setCerts(listCaCerts());
    } catch (e) {
      // Reaches only the db, so this is a real failure rather than the core not
      // being up.  Said out loud: an empty list on a security screen reads as
      // "no anchors" when it means "could not tell".
      setCerts([]);
      fail(`Could not read certificates: ${String(e)}`);
    }
  }, []);

  // The module refuses verify_certs_mode none off regtest, so a config holding
  // one cannot be saved back: it would fail initialise and roll back to itself.
  // Coerced to the default here rather than left to render as no mode at all.
  const normaliseModes = (cfg: MbsxConfig): MbsxConfig => {
    if (getNetwork() === 'regtest') {
      return cfg;
    }
    let found = false;
    const coins = Object.fromEntries(
      Object.entries(cfg.coins).map(([coin, settings]) => [
        coin,
        {
          ...settings,
          electrumx: settings.electrumx.map(server => {
            if (server.verify_certs_mode !== 'none') {
              return server;
            }
            found = true;
            return {...server, verify_certs_mode: 'pinned' as VerifyCertsMode};
          }),
        },
      ]),
    ) as MbsxConfig['coins'];
    if (found) {
      setStatus('Certificate checking was off; set to pinned');
    }
    return {...cfg, coins};
  };

  const load = useCallback(async () => {
    const loaded = normaliseModes((await readConfig()) ?? defaultConfig());
    setConfig(loaded);
    setSavedJson(JSON.stringify(loaded));
    setActiveCoins(coinsWithActiveSwaps());
    setCompiledCoins(getInfo()?.compiled_coins ?? null);
    loadCerts();
  }, [loadCerts]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    config !== null &&
    savedJson !== null &&
    JSON.stringify(config) !== savedJson;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // A drawer switch cannot be blocked, so the alert offers the way back
  // instead of preventing it.
  const navigation = useNavigation();
  useEffect(() => {
    return navigation.addListener('blur', () => {
      if (!dirtyRef.current) {
        return;
      }
      Alert.alert('Settings not applied', 'Save to apply your changes.', [
        {text: 'Discard', style: 'destructive', onPress: () => load()},
        {
          text: 'Keep editing',
          onPress: () => navigation.navigate('MbsxSettings' as never),
        },
      ]);
    });
  }, [navigation, load]);

  const edit = (patch: Partial<MbsxConfig>) => {
    setStatus('');
    setConfig(prev => (prev ? {...prev, ...patch} : prev));
  };

  // Disabling a coin stops it loading, and a swap whose coin never loads is
  // never watched: its timelocks pass with nothing acting on them.
  const toggleCoin = (coin: string, enabled: boolean) => {
    setStatus('');
    if (!enabled) {
      if (activeCoins === null) {
        fail('Cannot check for swaps in progress', coin);
        return;
      }
      if (activeCoins.has(coin.toUpperCase())) {
        fail(`${coin.toUpperCase()} has a swap in progress`, coin);
        return;
      }
    }
    fail('');
    setConfig(prev =>
      prev
        ? {
            ...prev,
            coins: {...prev.coins, [coin]: {...prev.coins[coin], enabled}},
          }
        : prev,
    );
  };

  const toggleVerifyPos = (coin: string, verify_pos: boolean) => {
    setStatus('');
    setConfig(prev =>
      prev
        ? {
            ...prev,
            coins: {...prev.coins, [coin]: {...prev.coins[coin], verify_pos}},
          }
        : prev,
    );
  };

  const editTlsField = (
    coin: string,
    index: number,
    patch: Partial<ElectrumServer>,
  ) => {
    setStatus('');
    setConfig(prev => {
      if (!prev) {
        return prev;
      }
      const servers = prev.coins[coin].electrumx.map((server, i) =>
        i === index ? {...server, ...patch} : server,
      );
      return {
        ...prev,
        coins: {
          ...prev.coins,
          [coin]: {...prev.coins[coin], electrumx: servers},
        },
      };
    });
  };

  const editMode = (coin: string, index: number, mode: VerifyCertsMode) =>
    editTlsField(coin, index, {verify_certs_mode: mode});

  const editHostname = (coin: string, index: number, value: boolean) =>
    editTlsField(coin, index, {verify_hostname: value});

  const editServer = (coin: string, index: number, url: string) => {
    setStatus('');
    setConfig(prev => {
      if (!prev) {
        return prev;
      }
      const servers = prev.coins[coin].electrumx.map((server, i) =>
        i === index ? {...server, url} : server,
      );
      return {
        ...prev,
        coins: {
          ...prev.coins,
          [coin]: {...prev.coins[coin], electrumx: servers},
        },
      };
    });
  };

  // TODO: the module only ever uses m_electrum_servers[0], so a second one is
  // configured and never reached.
  const addServer = (coin: string) => {
    setStatus('');
    if (!config || config.coins[coin].electrumx.length > 0) {
      fail('Only one server per coin is supported for now', coin);
      return;
    }
    fail('');
    setConfig(prev =>
      prev
        ? {
            ...prev,
            coins: {
              ...prev.coins,
              [coin]: {
                ...prev.coins[coin],
                electrumx: [...prev.coins[coin].electrumx, {url: ''}],
              },
            },
          }
        : prev,
    );
  };

  const removeServer = (coin: string, index: number) => {
    setStatus('');
    setConfig(prev =>
      prev
        ? {
            ...prev,
            coins: {
              ...prev.coins,
              [coin]: {
                ...prev.coins[coin],
                electrumx: prev.coins[coin].electrumx.filter(
                  (_, i) => i !== index,
                ),
              },
            },
          }
        : prev,
    );
  };

  // The module reloads its anchors and reconnects the affected clients on its
  // next pass, so this needs no restart.
  const addCert = () => {
    fail('');
    setStatus('');
    if (!certPem.trim()) {
      fail('Paste a certificate first');
      return;
    }
    // An anchor is looked up by host and port together, so a host without a
    // usable port is stored where nothing will ever match it.
    const host = certHost.trim();
    const port = certPort.trim() ? Number(certPort.trim()) : 0;
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      fail('Port must be a whole number from 1 to 65535');
      return;
    }
    if (host && port === 0) {
      fail('A certificate for one server needs its port');
      return;
    }
    try {
      addCaCert(certLabel.trim(), host, port, certPem.trim());
      setCertLabel('');
      setCertHost('');
      setCertPort('');
      setCertPem('');
      setStatus('Certificate added');
      loadCerts();
    } catch (e) {
      fail((e as Error).message);
    }
  };

  const removeCert = (id: bigint) => {
    fail('');
    setStatus('');
    try {
      removeCaCert(id);
      setStatus('Certificate removed');
      loadCerts();
    } catch (e) {
      fail((e as Error).message);
    }
  };

  const save = async () => {
    if (!config) {
      return;
    }
    fail('');
    setStatus('');
    const blank = Object.entries(config.coins).find(
      ([, coin]) =>
        coin.enabled === true &&
        coin.electrumx.some(server => !server.url.trim()),
    );
    if (blank) {
      fail(`Empty server url for ${blank[0]}`, blank[0]);
      return;
    }
    setSaving(true);
    try {
      await applyConfig(config);
      setSavedJson(JSON.stringify(config));
      setStatus('Saved and restarted');
    } catch (e) {
      fail(`Saved, but the restart failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
      dispatch(setRunning(isRunning()));
      setActiveCoins(coinsWithActiveSwaps());
    }
  };

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  // What the running core has, which is last start's setting rather than the
  // one the switch shows.
  const torPending = torEnabled !== (config.proxy !== undefined);

  // A coin the build does not have cannot be enabled, so its switch would do
  // nothing.
  const shownCoins = Object.keys(config.coins).filter(
    coin =>
      !compiledCoins ||
      compiledCoins.some(ticker => ticker.toLowerCase() === coin.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {dirty ? <Text style={styles.empty}>Unsaved changes</Text> : null}
        <Text style={styles.section}>Bridge</Text>
        <Text style={styles.inputLabel}>Pubkey</Text>
        <TextInput
          style={styles.input}
          value={config.bridge_pubkey}
          onChangeText={bridge_pubkey => edit({bridge_pubkey})}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>Host</Text>
        <TextInput
          style={styles.input}
          value={config.bridge_host}
          onChangeText={bridge_host => edit({bridge_host})}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>Port</Text>
        <TextInput
          style={styles.input}
          value={config.bridge_port ? String(config.bridge_port) : ''}
          onChangeText={text =>
            edit({bridge_port: text ? Number(text) : undefined})
          }
          keyboardType="numeric"
        />

        <Text style={styles.section}>Requests</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Revoke open requests on exit</Text>
          <Switch
            testID="mbsx-revoke-on-exit"
            value={config.revoke_open_requests_on_exit === true}
            onValueChange={value => edit({revoke_open_requests_on_exit: value})}
          />
        </View>
        <Text style={styles.rowMessage}>
          Leaving this section withdraws any request that has not accepted an
          offer, and frees the coins held for it.
        </Text>

        <Text style={styles.section}>Display</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Show state names</Text>
          <Switch
            testID="mbsx-show-raw-states"
            value={config.show_raw_states === true}
            onValueChange={value => {
              edit({show_raw_states: value});
              readConfig().then(current => {
                if (current) {
                  writeConfig({...current, show_raw_states: value});
                }
              });
            }}
          />
        </View>
        <Text style={styles.rowMessage}>
          Cards say what a swap is doing. Turn this on to also show the raw
          state name.
        </Text>

        <Text style={styles.section}>Privacy</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Tor</Text>
          <Switch testID="mbsx-tor" value={torEnabled} disabled />
        </View>
        <Text style={styles.rowMessage}>
          {torPending
            ? 'Set in Nexus settings. Applies to swaps on re-entering this section, or after an app restart while a swap is in flight.'
            : 'Set in Nexus settings, and applied to swaps as well.'}
        </Text>

        {shownCoins.map(coin => {
          const enabled = config.coins[coin].enabled === true;
          // The coin this app funds its own side of every swap from. Turning it
          // off leaves nothing to swap with.
          const ownCoin = config.coins[coin].wallet?.type === 'host';
          return (
            <View key={coin}>
              <View style={styles.row}>
                <Text style={styles.label}>{coin.toUpperCase()}</Text>
                {ownCoin ? (
                  <Text style={styles.value}>Always on</Text>
                ) : (
                  <Switch
                    testID={`mbsx-coin-enabled-${coin}`}
                    value={enabled}
                    onValueChange={value => toggleCoin(coin, value)}
                  />
                )}
              </View>
              {enabled && POS_COINS.includes(coin) ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>PoS validation</Text>
                    <Switch
                      testID={`mbsx-verify-pos-${coin}`}
                      value={config.coins[coin].verify_pos !== false}
                      onValueChange={value => toggleVerifyPos(coin, value)}
                    />
                  </View>
                  <Text style={styles.rowMessage}>
                    Each block is checked against the stake that signed it, and
                    a swap confirms only once that check reaches it. Off, the
                    server's word is taken for the chain.
                  </Text>
                </>
              ) : null}
              {enabled ? (
                <>
                  {config.coins[coin].electrumx.map((server, index) => (
                    <View key={index}>
                      <TextInput
                        style={styles.input}
                        value={server.url}
                        placeholder="tcp://host:port"
                        onChangeText={url => editServer(coin, index, url)}
                        autoCapitalize="none"
                      />
                      {server.url.startsWith('ssl://') ? (
                        <>
                          <Text style={styles.inputLabel}>
                            Certificate checks
                          </Text>
                          <View style={styles.modeRow}>
                            {modes.map(mode => {
                              const active =
                                (server.verify_certs_mode ?? 'pinned') === mode;
                              return (
                                <TouchableOpacity
                                  key={mode}
                                  testID={`mbsx-mode-${coin}-${mode}`}
                                  style={[
                                    styles.modeOption,
                                    active ? styles.modeOptionActive : null,
                                  ]}
                                  onPress={() => editMode(coin, index, mode)}>
                                  <Text
                                    style={[
                                      styles.modeText,
                                      active ? styles.modeTextActive : null,
                                    ]}>
                                    {mode}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {chainsChecked(server) ? (
                            <View style={styles.row}>
                              <Text style={styles.label}>Verify hostname</Text>
                              <Switch
                                testID={`mbsx-verify-hostname-${coin}`}
                                value={server.verify_hostname !== false}
                                onValueChange={value =>
                                  editHostname(coin, index, value)
                                }
                              />
                            </View>
                          ) : null}
                        </>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => removeServer(coin, index)}>
                        <Text style={styles.error}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    testID={`mbsx-add-server-${coin}`}
                    style={styles.button}
                    onPress={() => addServer(coin)}>
                    <Text style={styles.buttonText}>Add server</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {errorCoin === coin ? (
                <Text testID={`mbsx-coin-error-${coin}`} style={styles.error}>
                  {error}
                </Text>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.section}>Certificates</Text>
        <Text style={styles.value}>
          Trust anchors for the optional and strict checks. Naming a server
          confines the certificate to it, and replaces the built in roots for
          that server rather than adding to them.
        </Text>
        {certs.map(cert => (
          <View key={String(cert.id)} style={styles.certRow}>
            <Text style={styles.label}>{cert.label || 'Unlabelled'}</Text>
            <Text style={styles.value}>
              {cert.host ? `${cert.host}:${cert.port}` : 'Every server'}
            </Text>
            <TouchableOpacity
              testID={`mbsx-remove-cert-${cert.id}`}
              onPress={() => removeCert(cert.id)}>
              <Text style={styles.error}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Text style={styles.inputLabel}>Label</Text>
        <TextInput
          testID="mbsx-cert-label"
          style={styles.input}
          value={certLabel}
          onChangeText={setCertLabel}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>Host (blank for every server)</Text>
        <TextInput
          testID="mbsx-cert-host"
          style={styles.input}
          value={certHost}
          onChangeText={setCertHost}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>Port</Text>
        <TextInput
          testID="mbsx-cert-port"
          style={styles.input}
          value={certPort}
          onChangeText={setCertPort}
          keyboardType="numeric"
        />
        <Text style={styles.inputLabel}>Certificate (PEM)</Text>
        <TextInput
          testID="mbsx-cert-pem"
          style={[styles.input, styles.pemInput]}
          value={certPem}
          onChangeText={setCertPem}
          placeholder="-----BEGIN CERTIFICATE-----"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          testID="mbsx-add-cert"
          style={styles.button}
          onPress={addCert}>
          <Text style={styles.buttonText}>Add certificate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="mbsx-settings-save"
          style={[styles.button, saving ? styles.buttonDisabled : null]}
          disabled={saving}
          onPress={save}>
          <Text style={styles.buttonText}>
            {saving ? 'Restarting…' : dirty ? 'Save changes' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={load}>
          <Text style={styles.buttonSecondaryText}>Revert</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => setConfig(defaultConfig())}>
          <Text style={styles.buttonSecondaryText}>Restore defaults</Text>
        </TouchableOpacity>
        {error !== '' && errorCoin === '' ? (
          <Text testID="mbsx-settings-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {status !== '' ? (
          <Text testID="mbsx-settings-status" style={styles.status}>
            {status}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default MbsxSettings;
