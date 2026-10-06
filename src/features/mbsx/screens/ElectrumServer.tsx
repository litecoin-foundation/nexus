import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}>
        <View style={[styles.row, look.row]}>
          <Text style={styles.label}>Status</Text>
          <Text testID="mbsx-server-status" style={styles.value}>
            {[serverStateLabel(server, row), row?.version]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        {row?.error ? (
          <Text testID="mbsx-server-last-error" style={styles.error}>
            {row.error}
          </Text>
        ) : null}
        <View style={[styles.row, look.row]}>
          <Text style={styles.label}>Enabled</Text>
          <Switch
            testID="mbsx-server-enabled"
            value={server.disabled !== true}
            onValueChange={value => edit({disabled: !value})}
          />
        </View>
        <Text style={styles.inputLabel}>URL</Text>
        <TextInput
          testID="mbsx-server-url"
          style={styles.input}
          value={url}
          placeholder="tcp://host:port"
          onChangeText={text => edit({url: text})}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {urlError ? (
          <Text testID="mbsx-server-url-error" style={styles.error}>
            {`Server url ${urlError}`}
          </Text>
        ) : null}

        {url.startsWith('ssl://') ? (
          <>
            <Text style={swapCards.section}>Certificate</Text>
            <Text style={styles.inputLabel}>Check</Text>
            <View style={styles.modeRow}>
              {modes.map(mode => {
                const active = (server.verify_certs_mode ?? 'pinned') === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    testID={`mbsx-server-mode-${mode}`}
                    style={[
                      styles.modeOption,
                      active ? styles.modeOptionActive : null,
                    ]}
                    onPress={() => edit({verify_certs_mode: mode})}>
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
              <View style={[styles.row, look.row]}>
                <Text style={styles.label}>Verify Hostname</Text>
                <Switch
                  testID="mbsx-server-verify-hostname"
                  value={server.verify_hostname !== false}
                  onValueChange={value => edit({verify_hostname: value})}
                />
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Pinned Certificate</Text>
            {pin ? (
              <>
                <Text testID="mbsx-server-pin" style={styles.value} selectable>
                  {colonHex(pin.fingerprint)}
                </Text>
                <Text style={styles.value}>
                  {`Since ${new Date(pin.first_seen * 1000)
                    .toISOString()
                    .slice(
                      0,
                      10,
                    )}, ${pin.ca_signed ? 'CA-signed' : 'self-signed'}`}
                </Text>
                <TouchableOpacity
                  testID="mbsx-server-forget-pin"
                  style={styles.buttonSecondary}
                  onPress={confirmForgetPin}>
                  <Text style={styles.buttonSecondaryText}>
                    Forget Pinned Certificate
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text testID="mbsx-server-pin" style={styles.value}>
                None yet: the first connection pins it
              </Text>
            )}

            <Text style={styles.inputLabel}>CA Certificates</Text>
            {cas.map(cert => (
              <View key={String(cert.id)} style={styles.certRow}>
                <Text style={styles.label}>{cert.label || 'Unlabelled'}</Text>
                <TouchableOpacity
                  testID={`mbsx-server-remove-ca-${cert.id}`}
                  style={styles.buttonSecondary}
                  onPress={() => confirmRemoveCert(cert.id)}>
                  <Text style={styles.buttonSecondaryText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
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
              <Text style={styles.buttonSecondaryText}>Add CA Certificate</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          testID="mbsx-server-advanced"
          onPress={() => setAdvanced(open => !open)}>
          <Text style={swapCards.section}>Advanced</Text>
        </TouchableOpacity>
        {advanced ? (
          <>
            <View style={[styles.row, look.row]}>
              <Text style={styles.label}>Verbose Transactions</Text>
              <Switch
                testID="mbsx-server-verbose"
                value={server.haveverbosetx !== false}
                onValueChange={value => edit({haveverbosetx: value})}
              />
            </View>
            <Text style={styles.value}>Off for electrs servers.</Text>
            <TouchableOpacity
              testID="mbsx-server-remove"
              style={styles.buttonSecondary}
              onPress={confirmRemoveServer}>
              <Text style={styles.buttonSecondaryText}>Remove Server</Text>
            </TouchableOpacity>
          </>
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
  row: {
    paddingHorizontal: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
});

export default ElectrumServer;
