import React, {useCallback, useContext, useEffect, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import type {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useBottomInset} from '../components/useBottomInset';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {
  addCaCert,
  electrumUrlError,
  getInfo,
  isRunning,
  listCaCerts,
  listPinnedCerts,
  removeCaCert,
  removePinnedCert,
} from '../adapter';
import type {
  CaCert,
  ElectrumServer as ServerConfig,
  PinnedCert,
  VerifyCertsMode,
} from '../adapter';
import {setRunning} from '../mbsxSlice';
import {getNetwork} from '../network';
import {
  editServer,
  removeServer,
  saveSettingsDraft,
  serverHostPort,
  serverErrorLabel,
  serverStateLabel,
  useSettingsDraft,
  useUnsavedDraftGuard,
} from '../settingsDraft';
import type {ServerRow} from '../settingsDraft';
import MbsxBackButton from '../components/MbsxBackButton';
import {swapCards} from '../swapCards';
import {getMbsxStyles} from '../theme';
import type {MbsxDrawerParamList} from '../types';

const ALL_MODES: VerifyCertsMode[] = ['none', 'pinned', 'optional', 'strict'];
const MODE_LABELS: Record<VerifyCertsMode, string> = {
  none: 'None',
  pinned: 'Pinned',
  optional: 'Optional',
  strict: 'Strict',
};
const REFRESH_MS = 5000;

// Only these validate a chain, so only these have anchors or a hostname to check
const chainsChecked = (server: ServerConfig) =>
  server.verify_certs_mode === 'optional' ||
  server.verify_certs_mode === 'strict';

const colonHex = (hex: string) => hex.match(/.{1,2}/g)?.join(':') ?? hex;

type Props = DrawerScreenProps<MbsxDrawerParamList, 'ElectrumServer'>;

const ElectrumServer: React.FC<Props> = ({navigation, route}) => {
  const {coin, index} = route.params;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const keyboardHeight = useKeyboardHeight();
  const dispatch = useAppDispatch();
  const storedJson = useAppSelector(state => state.mbsx.settingsStoredJson);
  const {config, setConfig, dirty} = useSettingsDraft();
  const [row, setRow] = useState<ServerRow | undefined>(undefined);
  const [pin, setPin] = useState<PinnedCert | undefined>(undefined);
  const [cas, setCas] = useState<CaCert[]>([]);
  const [certLabel, setCertLabel] = useState('');
  const [certPem, setCertPem] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  useUnsavedDraftGuard(dirty, 'ElectrumServer');

  const server = config?.coins[coin]?.electrumx[index];
  const url = server?.url ?? '';
  const pageTitle = url.replace(/^(tcp|ssl):\/\//, '') || 'New Server';

  useEffect(() => {
    navigation.setOptions?.({
      title: pageTitle,
      headerLeft: () => (
        <MbsxBackButton
          onPress={() => navigation.navigate('ElectrumServers', {coin})}
        />
      ),
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation, coin, pageTitle]);
  const target = serverHostPort(url);
  const modes =
    getNetwork() === 'regtest'
      ? ALL_MODES
      : ALL_MODES.filter(mode => mode !== 'none');

  const refresh = useCallback(() => {
    const where = serverHostPort(url);
    const info = getInfo();
    setRow(
      info?.coins[coin.toUpperCase()]?.electrum_servers?.find(
        candidate => candidate.url === url,
      ),
    );
    if (!where) {
      setPin(undefined);
      setCas([]);
      return;
    }
    try {
      setPin(
        listPinnedCerts().find(
          cert => cert.host === where.host && cert.port === where.port,
        ),
      );
      setCas(
        listCaCerts().filter(
          cert => cert.host === where.host && cert.port === where.port,
        ),
      );
    } catch (e) {
      setError(`Could not read certificates: ${(e as Error).message}`);
    }
  }, [coin, url]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, REFRESH_MS);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  const edit = (patch: Partial<ServerConfig>) => {
    setStatus('');
    setConfig(prev => editServer(prev, coin, index, patch));
  };

  const confirmForgetPin = () => {
    if (!target) {
      return;
    }
    Alert.alert(
      'Forget Pinned Certificate',
      'The next connection trusts whatever certificate the server presents.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Forget',
          style: 'destructive',
          onPress: () => {
            try {
              removePinnedCert(target.host, target.port);
              setStatus('Pinned certificate forgotten');
              refresh();
            } catch (e) {
              setError((e as Error).message);
            }
          },
        },
      ],
    );
  };

  const addCert = () => {
    setError('');
    setStatus('');
    if (!target) {
      setError('Set a valid server url first');
      return;
    }
    if (!certPem.trim()) {
      setError('Paste a certificate first');
      return;
    }
    try {
      addCaCert(certLabel.trim(), target.host, target.port, certPem.trim());
      setCertLabel('');
      setCertPem('');
      setStatus('Certificate added');
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmRemoveCert = (id: bigint) => {
    Alert.alert('Remove Certificate', 'Remove this certificate?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          try {
            removeCaCert(id);
            setStatus('Certificate removed');
            refresh();
          } catch (e) {
            setError((e as Error).message);
          }
        },
      },
    ]);
  };

  const confirmRemoveServer = () => {
    Alert.alert('Remove Server', 'Remove this server?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setConfig(prev => removeServer(prev, coin, index));
          navigation.navigate('ElectrumServers', {coin});
        },
      },
    ]);
  };

  const save = async () => {
    if (!config) {
      return;
    }
    setError('');
    setStatus('');
    setSaving(true);
    try {
      if (
        await saveSettingsDraft(config, storedJson, dispatch, problem =>
          setError(problem.message),
        )
      ) {
        setStatus('Saved and restarted');
      }
    } catch (e) {
      setError(`Saved, but the restart failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
      dispatch(setRunning(isRunning()));
      refresh();
    }
  };

  if (!server) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Server not found</Text>
      </View>
    );
  }

  const urlError = url.trim() ? electrumUrlError(url) : '';

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}>
        <View style={swapCards.card}>
          <View style={look.rowPair}>
            <Text style={styles.label}>Status</Text>
            <Text testID="mbsx-server-status" style={look.rowValue}>
              {[serverStateLabel(server, row), row?.version]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          {row?.error ? (
            <Text testID="mbsx-server-last-error" style={look.error}>
              {serverErrorLabel(row.error)}
            </Text>
          ) : null}
          <View style={[look.rowPair, look.rowLine]}>
            <Text style={styles.label}>Enabled</Text>
            <Switch
              testID="mbsx-server-enabled"
              value={server.disabled !== true}
              onValueChange={value => edit({disabled: !value})}
            />
          </View>
        </View>
        <View style={swapCards.card}>
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            testID="mbsx-server-url"
            style={styles.input}
            value={url}
            placeholder="ssl://host:port"
            onChangeText={text => edit({url: text})}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {urlError ? (
            <Text testID="mbsx-server-url-error" style={styles.error}>
              {`Server url ${urlError}`}
            </Text>
          ) : null}
        </View>

        {url.startsWith('ssl://') ? (
          <>
            <Text style={swapCards.section}>Certificate</Text>
            <View style={swapCards.card}>
              <Text style={styles.inputLabel}>Check</Text>
              <View style={styles.modeRow}>
                {modes.map(mode => {
                  const active =
                    (server.verify_certs_mode ?? 'pinned') === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      testID={`mbsx-server-mode-${mode}`}
                      style={[
                        styles.modeOption,
                        look.chip,
                        active ? styles.modeOptionActive : null,
                      ]}
                      onPress={() => edit({verify_certs_mode: mode})}>
                      <Text
                        style={[
                          styles.modeText,
                          active ? styles.modeTextActive : null,
                        ]}>
                        {MODE_LABELS[mode]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {chainsChecked(server) ? (
                <View style={[look.rowPair, look.rowLine]}>
                  <Text style={styles.label}>Verify Hostname</Text>
                  <Switch
                    testID="mbsx-server-verify-hostname"
                    value={server.verify_hostname !== false}
                    onValueChange={value => edit({verify_hostname: value})}
                  />
                </View>
              ) : null}
            </View>

            <Text style={swapCards.section}>Pinned Certificate</Text>
            <View style={swapCards.card}>
              {pin ? (
                <>
                  <Text testID="mbsx-server-pin" style={look.pin} selectable>
                    {colonHex(pin.fingerprint)}
                  </Text>
                  <Text style={swapCards.note}>
                    {`Since ${new Date(pin.first_seen * 1000)
                      .toISOString()
                      .slice(0, 10)}, ${
                      pin.ca_signed ? 'CA-signed' : 'self-signed'
                    }`}
                  </Text>
                  <TouchableOpacity
                    testID="mbsx-server-forget-pin"
                    onPress={confirmForgetPin}>
                    <Text style={swapCards.link}>Forget</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text testID="mbsx-server-pin" style={swapCards.note}>
                  None yet. The first connection pins it.
                </Text>
              )}
            </View>

            <Text style={swapCards.section}>CA Certificates</Text>
            {cas.length === 0 ? (
              <View style={swapCards.card}>
                <Text style={swapCards.note}>No certificates</Text>
              </View>
            ) : (
              cas.map(cert => (
                <View key={String(cert.id)} style={swapCards.card}>
                  <View style={look.rowPair}>
                    <Text style={[styles.label, look.rowLabel]}>
                      {cert.label || 'Unlabelled'}
                    </Text>
                    <TouchableOpacity
                      testID={`mbsx-server-remove-ca-${cert.id}`}
                      onPress={() => confirmRemoveCert(cert.id)}>
                      <Text style={look.remove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Text style={swapCards.section}>Add CA Certificate</Text>
            <View style={swapCards.card}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                testID="mbsx-server-ca-label"
                style={styles.input}
                value={certLabel}
                onChangeText={setCertLabel}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>Certificate (PEM)</Text>
              <TextInput
                testID="mbsx-server-ca-pem"
                style={[styles.input, styles.pemInput]}
                value={certPem}
                onChangeText={setCertPem}
                placeholder="-----BEGIN CERTIFICATE-----"
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                testID="mbsx-server-add-ca"
                style={styles.buttonSecondary}
                onPress={addCert}>
                <Text style={styles.buttonSecondaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          testID="mbsx-server-advanced"
          style={swapCards.advancedToggle}
          onPress={() => setAdvanced(open => !open)}>
          <Text style={swapCards.advancedLabel}>Advanced</Text>
          <Image
            source={require('../../../assets/images/forward.png')}
            style={[swapCards.chevron, advanced ? swapCards.chevronOpen : null]}
          />
        </TouchableOpacity>
        {advanced ? (
          <View style={swapCards.card}>
            <View style={look.rowPair}>
              <Text style={[styles.label, look.rowLabel]}>
                Verbose Transactions
              </Text>
              <Switch
                testID="mbsx-server-verbose"
                value={server.haveverbosetx !== false}
                onValueChange={value => edit({haveverbosetx: value})}
              />
            </View>
            <Text style={look.note}>Off for electrs servers.</Text>
            <TouchableOpacity
              testID="mbsx-server-remove"
              style={styles.buttonSecondary}
              onPress={confirmRemoveServer}>
              <Text style={styles.buttonSecondaryText}>Remove Server</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <Text testID="mbsx-server-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {status ? (
          <Text testID="mbsx-server-status-message" style={styles.status}>
            {status}
          </Text>
        ) : null}
        {dirty ? (
          <TouchableOpacity
            testID="mbsx-server-save"
            style={[styles.button, saving ? styles.buttonDisabled : null]}
            disabled={saving}
            onPress={save}>
            <Text style={styles.buttonText}>
              {saving ? 'Restarting…' : 'Save and Restart'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const look = StyleSheet.create({
  rowPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#747E87',
  },
  error: {
    marginTop: 8,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#ef3329',
    textAlign: 'left',
  },
  note: {
    marginTop: 8,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
  },
  chip: {
    backgroundColor: '#F4F7FB',
    borderWidth: 0,
  },
  pin: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  remove: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2C72FF',
    fontSize: 14,
  },
});

export default ElectrumServer;
