import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useKeyboardHeight} from '../useKeyboardHeight';
import {useNavigation} from '@react-navigation/native';
import type {DrawerNavigationProp} from '@react-navigation/drawer';
import notifee from '@notifee/react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {COIN_ICONS, coinPlate, swapCards} from '../swapCards';
import {setRunning} from '../mbsxSlice';
import {
  PAY_IN_COINS,
  addCaCert,
  coinsWithActiveSwaps,
  getInfo,
  defaultConfig,
  isRunning,
  listCaCerts,
  readConfig,
  removeCaCert,
  rescanDeposits,
  updateConfig,
} from '../adapter';
import type {CaCert, MbsxConfig} from '../adapter';
import {
  changedElsewhere,
  loadSettingsDraft,
  saveSettingsDraft,
  useSettingsDraft,
  useUnsavedDraftGuard,
} from '../settingsDraft';
import type {ServerRow} from '../settingsDraft';
import {readRateServices} from '../rates';
import type {MbsxDrawerParamList} from '../types';

const POS_COINS = ['part'];

// The module's own default when the config leaves it out.
const DEFAULT_MAX_ELECTRUM_SERVERS = 2;

const MbsxSettings: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const insets = useSafeAreaInsets();
  const [advanced, setAdvanced] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const dispatch = useAppDispatch();
  const {config, setConfig, dirty} = useSettingsDraft();
  const storedJson = useAppSelector(state => state.mbsx.settingsStoredJson);
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
  const [rescanned, setRescanned] = useState('');
  const [saving, setSaving] = useState(false);
  const [ratesOn, setRatesOn] = useState<boolean | null>(null);
  const [certs, setCerts] = useState<CaCert[]>([]);
  const [certLabel, setCertLabel] = useState('');
  const [certHost, setCertHost] = useState('');
  const [certPort, setCertPort] = useState('');
  const [certPem, setCertPem] = useState('');

  const [serverStates, setServerStates] = useState<Record<string, ServerRow>>(
    {},
  );

  const fail = (message: string, coin = '') => {
    setError(message);
    setErrorCoin(coin);
  };

  const rescan = (coin: string) => {
    setRescanned('');
    try {
      rescanDeposits(coin.toUpperCase());
      fail('');
      setRescanned(coin);
    } catch (e) {
      fail((e as Error).message, coin);
    }
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

  const readServerStates = useCallback(() => {
    const info = getInfo();
    setCompiledCoins(info?.compiled_coins ?? null);
    const states: Record<string, ServerRow> = {};
    for (const [ticker, coin] of Object.entries(info?.coins ?? {})) {
      for (const server of coin.electrum_servers ?? []) {
        states[`${ticker.toLowerCase()} ${server.url}`] = server;
      }
    }
    setServerStates(states);
  }, []);

  const load = useCallback(async () => {
    if (await loadSettingsDraft(dispatch)) {
      setStatus('Certificate checking was off; set to pinned');
    }
    setActiveCoins(coinsWithActiveSwaps());
    readServerStates();
    loadCerts();
  }, [dispatch, loadCerts, readServerStates]);

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const storedJsonRef = useRef(storedJson);
  storedJsonRef.current = storedJson;

  const offerReload = useCallback(async () => {
    if (!(await changedElsewhere(storedJsonRef.current))) {
      return;
    }
    if (!dirtyRef.current) {
      load();
      return;
    }
    Alert.alert(
      'Settings Changed',
      'The settings were changed outside this screen, for example by the ' +
        'server banner. Reload them and drop your unsaved changes?',
      [
        {text: 'Keep Editing', style: 'cancel'},
        {text: 'Reload', style: 'destructive', onPress: () => load()},
      ],
    );
  }, [load]);

  // Unsaved edits outlive leaving the section, so coming back keeps them
  useEffect(() => {
    if (!dirtyRef.current) {
      load();
      return;
    }
    setActiveCoins(coinsWithActiveSwaps());
    readServerStates();
    loadCerts();
    offerReload();
  }, [load, loadCerts, offerReload, readServerStates]);

  // A drawer switch cannot be blocked, so the alert offers the way back
  // instead of preventing it.
  const navigation = useNavigation<DrawerNavigationProp<MbsxDrawerParamList>>();
  useEffect(() => {
    const readRates = () =>
      readRateServices().then(services => setRatesOn(services.enabled));
    readRates();
    return navigation.addListener('focus', () => {
      readServerStates();
      readRates();
      offerReload();
    });
  }, [navigation, offerReload, readServerStates]);
  useUnsavedDraftGuard(dirty, 'MbsxSettings');

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

  const confirmRemoveCert = (id: bigint) => {
    Alert.alert('Remove Certificate', 'Remove this certificate?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeCert(id),
      },
    ]);
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
    setSaving(true);
    try {
      if (
        await saveSettingsDraft(config, storedJson, dispatch, problem => {
          setAdvanced(true);
          fail(problem.message, problem.coin);
        })
      ) {
        setStatus('Saved and restarted');
      }
    } catch (e) {
      fail(`Saved, but the restart failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
      dispatch(setRunning(isRunning()));
      setActiveCoins(coinsWithActiveSwaps());
      readServerStates();
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

  const saveActions = (
    <>
      <TouchableOpacity
        testID="mbsx-settings-save"
        style={[styles.button, saving ? styles.buttonDisabled : null]}
        disabled={saving}
        onPress={save}>
        <Text style={styles.buttonText}>
          {saving ? 'Restarting…' : dirty ? 'Save and Restart' : 'Save'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={load}>
        <Text style={styles.buttonSecondaryText}>Revert</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() =>
          setConfig(current =>
            current
              ? {
                  ...defaultConfig(),
                  show_raw_states: current.show_raw_states,
                  notify_swaps: current.notify_swaps,
                  show_debug: current.show_debug,
                  show_utc_times: current.show_utc_times,
                }
              : defaultConfig(),
          )
        }>
        <Text style={styles.buttonSecondaryText}>Restore Defaults</Text>
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
    </>
  );

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <ScrollView
        style={look.scroller}
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: Math.max(insets.bottom, 16) + 24},
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={swapCards.card}>
          <Text style={swapCards.section}>Requests</Text>
          <View style={look.cardRow}>
            <Text style={[styles.label, look.rowLabel]}>
              Revoke Open Requests on Exit
            </Text>
            <Switch
              testID="mbsx-revoke-on-exit"
              value={config.revoke_open_requests_on_exit === true}
              onValueChange={value =>
                edit({revoke_open_requests_on_exit: value})
              }
            />
          </View>
          <Text style={look.note}>
            Leaving the BasicSwap section withdraws any request that has not
            accepted an offer, and frees the coins held for it.
          </Text>

          <Text style={swapCards.section}>Privacy</Text>
          <View style={look.cardRow}>
            <Text style={[styles.label, look.rowLabel]}>
              Swap Notifications
            </Text>
            <Switch
              testID="mbsx-notify-swaps"
              value={config.notify_swaps !== false}
              onValueChange={value => {
                edit({notify_swaps: value});
                if (value) {
                  void notifee.requestPermission();
                }
                updateConfig(current => ({
                  ...current,
                  notify_swaps: value,
                })).catch(e => setError((e as Error).message));
              }}
            />
          </View>
          <Text style={look.note}>
            Alerts when a swap ends or needs attention. Amounts are never
            included.
          </Text>

          <View style={look.cardRow}>
            <Text style={[styles.label, look.rowLabel]}>Tor</Text>
            <Text testID="mbsx-tor-state" style={styles.value}>
              {torEnabled ? 'On' : 'Off'}
            </Text>
          </View>
          <Text testID="mbsx-tor" style={look.note}>
            {torPending
              ? 'Set in Nexus settings. Applies to swaps on re-entering the BasicSwap section, or after an app restart while a swap is in flight.'
              : 'Set in Nexus settings, and applied to swaps as well.'}
          </Text>
        </View>

        <Text style={swapCards.section}>Coins</Text>
        {shownCoins.map(coin => {
          const enabled = config.coins[coin].enabled === true;
          // The coin this app funds its own side of every swap from. Turning it
          // off leaves nothing to swap with.
          const ownCoin = config.coins[coin].wallet?.type === 'host';
          const ticker = coin.toUpperCase();
          return (
            <View key={coin} style={swapCards.card}>
              <View style={look.cardRow}>
                <View style={look.coinTitle}>
                  <View
                    style={[
                      look.coinCircle,
                      {
                        backgroundColor: coinPlate(ticker),
                      },
                    ]}>
                    {COIN_ICONS[ticker] ? (
                      <Image
                        source={COIN_ICONS[ticker]}
                        style={look.coinMark}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.label}>{ticker}</Text>
                </View>
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
                  <View style={[look.cardRow, look.cardRowLine]}>
                    <Text style={[styles.label, look.rowLabel]}>
                      PoS Validation
                    </Text>
                    <Switch
                      testID={`mbsx-verify-pos-${coin}`}
                      value={config.coins[coin].verify_pos !== false}
                      onValueChange={value => toggleVerifyPos(coin, value)}
                    />
                  </View>
                  <Text style={look.note}>
                    Each block is checked against the stake that signed it, and
                    a swap confirms only once that check reaches it. Off, the
                    server's word is taken for the chain.
                  </Text>
                </>
              ) : null}
              {enabled && PAY_IN_COINS.includes(ticker) ? (
                <>
                  <TouchableOpacity
                    testID={`mbsx-rescan-deposits-${coin}`}
                    style={styles.buttonSecondary}
                    disabled={!isRunning()}
                    onPress={() => rescan(coin)}>
                    <Text style={styles.buttonSecondaryText}>
                      Rescan Pay-In Addresses
                    </Text>
                  </TouchableOpacity>
                  {rescanned === coin ? (
                    <Text
                      testID={`mbsx-rescan-started-${coin}`}
                      style={look.note}>
                      Looking for pay-ins made from this seed
                    </Text>
                  ) : null}
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

        <Text style={swapCards.section}>Electrum Servers</Text>
        <View style={swapCards.card}>
          {shownCoins
            .filter(coin => config.coins[coin].enabled === true)
            .map((coin, i) => {
              const servers = config.coins[coin].electrumx;
              const enabledCount = servers.filter(
                server => !server.disabled,
              ).length;
              const connected = servers.filter(server => {
                const row = serverStates[`${coin} ${server.url}`];
                return !server.disabled && row?.state === 'active' && row.live;
              }).length;
              const cap =
                config.coins[coin].max_electrum_servers ??
                config.max_electrum_servers ??
                DEFAULT_MAX_ELECTRUM_SERVERS;
              const summary = [
                `${connected} connected`,
                `${enabledCount} enabled`,
                ...(cap < enabledCount ? [`keeps ${cap}`] : []),
                ...(enabledCount === 0 ? ['no enabled server'] : []),
              ].join(' · ');
              return (
                <TouchableOpacity
                  key={coin}
                  testID={`mbsx-servers-${coin}`}
                  style={[look.cardRow, i > 0 ? look.cardRowLine : null]}
                  onPress={() =>
                    navigation.navigate('ElectrumServers', {coin})
                  }>
                  <Text style={[styles.label, look.rowLabel]}>
                    {coin.toUpperCase()}
                  </Text>
                  <Text
                    testID={`mbsx-servers-summary-${coin}`}
                    style={enabledCount === 0 ? styles.error : styles.value}>
                    {summary}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        <Text style={[swapCards.section, look.blockTitle]}>
          Coin Rate Services
        </Text>
        <View style={swapCards.card}>
          <TouchableOpacity
            testID="mbsx-rate-services"
            style={look.cardRow}
            onPress={() => navigation.navigate('CoinRateServices')}>
            <Text style={[styles.label, look.rowLabel]}>Fetch Coin Rates</Text>
            <Text testID="mbsx-rate-services-summary" style={styles.value}>
              {ratesOn === null ? '' : ratesOn ? 'On' : "Off, server's prices"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={swapCards.advancedToggle}
          onPress={() => setAdvanced(open => !open)}>
          <Text style={swapCards.advancedLabel}>Advanced</Text>
          <Image
            source={require('../../../assets/images/forward.png')}
            style={[swapCards.chevron, advanced ? swapCards.chevronOpen : null]}
          />
        </TouchableOpacity>
        {advanced ? (
          <>
            <View style={swapCards.card}>
              <Text style={swapCards.section}>Display</Text>
              <View style={look.cardRow}>
                <Text style={[styles.label, look.rowLabel]}>
                  Show State Names
                </Text>
                <Switch
                  testID="mbsx-show-raw-states"
                  value={config.show_raw_states === true}
                  onValueChange={value => {
                    edit({show_raw_states: value});
                    updateConfig(current => ({
                      ...current,
                      show_raw_states: value,
                    })).catch(e => setError((e as Error).message));
                  }}
                />
              </View>
              <Text style={look.note}>
                Cards say what a swap is doing. Turn this on to also show the
                raw state name.
              </Text>
              <View style={[look.cardRow, look.cardRowLine]}>
                <Text style={[styles.label, look.rowLabel]}>Show Debug</Text>
                <Switch
                  testID="mbsx-show-debug"
                  value={config.show_debug === true}
                  onValueChange={value => {
                    edit({show_debug: value});
                    updateConfig(current => ({
                      ...current,
                      show_debug: value,
                    })).catch(e => setError((e as Error).message));
                  }}
                />
              </View>
              <Text style={look.note}>
                Adds Debug page and options. Off by default.
              </Text>
              <View style={[look.cardRow, look.cardRowLine]}>
                <Text style={[styles.label, look.rowLabel]}>
                  Show Times In UTC
                </Text>
                <Switch
                  testID="mbsx-show-utc-times"
                  value={config.show_utc_times === true}
                  onValueChange={value => {
                    edit({show_utc_times: value});
                    updateConfig(current => ({
                      ...current,
                      show_utc_times: value,
                    })).catch(e => setError((e as Error).message));
                  }}
                />
              </View>
              <Text style={look.note}>
                Times show in this phone's time zone. Turn this on to show them
                in UTC.
              </Text>
            </View>

            <Text style={[swapCards.section, look.blockTitle]}>Bridge</Text>
            <View style={swapCards.card}>
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
            </View>

            <Text style={[swapCards.section, look.blockTitle]}>
              Electrum Servers
            </Text>
            <View style={swapCards.card}>
              <Text style={styles.inputLabel}>Kept Connected per Coin</Text>
              <TextInput
                testID="mbsx-max-electrum-servers"
                style={styles.input}
                value={
                  config.max_electrum_servers
                    ? String(config.max_electrum_servers)
                    : ''
                }
                placeholder={String(DEFAULT_MAX_ELECTRUM_SERVERS)}
                onChangeText={text =>
                  edit({max_electrum_servers: text ? Number(text) : undefined})
                }
                keyboardType="numeric"
              />
            </View>

            <Text style={[swapCards.section, look.blockTitle]}>
              Certificates
            </Text>
            <View style={swapCards.card}>
              <Text style={swapCards.note}>
                Trust anchors for the optional and strict checks. Naming a
                server confines the certificate to it, and replaces the built in
                roots for that server rather than adding to them.
              </Text>
            </View>
            {certs.length === 0 ? (
              <View style={swapCards.card}>
                <Text style={swapCards.note}>No certificates</Text>
              </View>
            ) : (
              certs.map(cert => (
                <View key={String(cert.id)} style={swapCards.card}>
                  <View style={look.cardRow}>
                    <View style={look.rowLabel}>
                      <Text style={styles.label}>
                        {cert.label || 'Unlabelled'}
                      </Text>
                      <Text style={swapCards.note}>
                        {cert.host
                          ? `${cert.host}:${cert.port}`
                          : 'Every Server'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      testID={`mbsx-remove-cert-${cert.id}`}
                      onPress={() => confirmRemoveCert(cert.id)}>
                      <Text style={look.remove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <Text style={[swapCards.section, look.blockTitle]}>
              Add Certificate
            </Text>
            <View style={swapCards.card}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                testID="mbsx-cert-label"
                style={styles.input}
                value={certLabel}
                onChangeText={setCertLabel}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>
                Host (Blank for Every Server)
              </Text>
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
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {dirty ? null : saveActions}
      </ScrollView>
      {dirty ? (
        <View
          style={[
            look.footer,
            {
              paddingBottom:
                keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 12),
            },
          ]}>
          {saveActions}
        </View>
      ) : null}
    </View>
  );
};

const look = StyleSheet.create({
  scroller: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  cardRowLine: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
  },
  blockTitle: {
    marginTop: 22,
    marginBottom: 12,
  },
  note: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
    marginTop: 6,
  },
  coinTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  coinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
  },
  coinMark: {
    width: 32,
    height: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F2F8FD',
  },
  remove: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2C72FF',
    fontSize: 14,
  },
});

export default MbsxSettings;
