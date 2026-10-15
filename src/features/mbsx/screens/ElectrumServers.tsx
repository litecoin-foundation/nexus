import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
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
import {getInfo, isRunning} from '../adapter';
import {setRunning} from '../mbsxSlice';
import {
  addServer,
  editCoinCap,
  editServer,
  loadSettingsDraft,
  saveSettingsDraft,
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

const DEFAULT_MAX_ELECTRUM_SERVERS = 2;
const REFRESH_MS = 5000;

type Props = DrawerScreenProps<MbsxDrawerParamList, 'ElectrumServers'>;

const ElectrumServers: React.FC<Props> = ({navigation, route}) => {
  const {coin} = route.params;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const keyboardHeight = useKeyboardHeight();
  const dispatch = useAppDispatch();
  const storedJson = useAppSelector(state => state.mbsx.settingsStoredJson);
  const {config, setConfig, dirty} = useSettingsDraft();
  const [rows, setRows] = useState<Record<string, ServerRow>>({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  useUnsavedDraftGuard(dirty, 'ElectrumServers');


  useEffect(() => {
    navigation.setOptions?.({
      title: `${coin.toUpperCase()} Servers`,
      headerLeft: () => (
        <MbsxBackButton onPress={() => navigation.navigate('MbsxSettings')} />
      ),
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation, coin]);

  useEffect(() => {
    if (!config) {
      loadSettingsDraft(dispatch);
    }
  }, [config, dispatch]);

  const readRows = useCallback(() => {
    const info = getInfo();
    const found: Record<string, ServerRow> = {};
    for (const row of info?.coins[coin.toUpperCase()]?.electrum_servers ?? []) {
      found[row.url] = row;
    }
    setRows(found);
  }, [coin]);

  useFocusEffect(
    useCallback(() => {
      readRows();
      const timer = setInterval(readRows, REFRESH_MS);
      return () => clearInterval(timer);
    }, [readRows]),
  );

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
      readRows();
    }
  };

  const settings = config?.coins[coin];
  if (!config || !settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}>
        <View style={swapCards.card}>
          <Text style={styles.inputLabel}>Kept Connected</Text>
          <TextInput
            testID="mbsx-servers-cap"
            style={styles.input}
            value={
              settings.max_electrum_servers
                ? String(settings.max_electrum_servers)
                : ''
            }
            placeholder={String(
              config.max_electrum_servers ?? DEFAULT_MAX_ELECTRUM_SERVERS,
            )}
            onChangeText={text =>
              setConfig(prev => editCoinCap(prev, coin, text))
            }
            keyboardType="numeric"
          />
        </View>
        {settings.electrumx.map((server, index) => {
          const row = rows[server.url];
          return (
            <TouchableOpacity
              key={index}
              testID={`mbsx-server-row-${index}`}
              onPress={() =>
                navigation.navigate('ElectrumServer', {coin, index})
              }>
              <View style={[swapCards.card, look.serverRow]}>
                <View>
                  <Text style={styles.label}>
                    {server.url.replace(/^(tcp|ssl):\/\//, '') || 'New Server'}
                  </Text>
                  <Text
                    testID={`mbsx-server-state-${index}`}
                    style={styles.value}>
                    {serverStateLabel(server, row)}
                  </Text>
                  {row?.error && !server.disabled ? (
                    <Text style={look.error}>{serverErrorLabel(row.error)}</Text>
                  ) : null}
                </View>
                <Switch
                  testID={`mbsx-server-enabled-${index}`}
                  value={server.disabled !== true}
                  onValueChange={value =>
                    setConfig(prev =>
                      editServer(prev, coin, index, {disabled: !value}),
                    )
                  }
                />
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          testID="mbsx-add-server"
          style={styles.buttonSecondary}
          onPress={() => {
            setConfig(prev => addServer(prev, coin));
            navigation.navigate('ElectrumServer', {
              coin,
              index: settings.electrumx.length,
            });
          }}>
          <Text style={styles.buttonSecondaryText}>Add Server</Text>
        </TouchableOpacity>
        {error ? (
          <Text testID="mbsx-servers-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {status ? (
          <Text testID="mbsx-servers-status" style={styles.status}>
            {status}
          </Text>
        ) : null}
        {dirty ? (
          <TouchableOpacity
            testID="mbsx-servers-save"
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
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  error: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#ef3329',
    textAlign: 'left',
  },
});

export default ElectrumServers;
