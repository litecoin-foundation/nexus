import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {setRunning} from '../mbsxSlice';
import {
  applyConfig,
  coinsWithActiveSwaps,
  defaultConfig,
  isRunning,
  readConfig,
} from '../adapter';
import type {MbsxConfig} from '../adapter';

const MbsxSettings: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const [config, setConfig] = useState<MbsxConfig | null>(null);
  const [activeCoins, setActiveCoins] = useState<Set<string> | null>(null);
  const [error, setError] = useState('');
  // A coin-scoped error renders inside that coin's block. At the foot of the
  // screen, next to Save, it is off screen for whichever coin was pressed.
  const [errorCoin, setErrorCoin] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fail = (message: string, coin = '') => {
    setError(message);
    setErrorCoin(coin);
  };

  const load = useCallback(async () => {
    setConfig((await readConfig()) ?? defaultConfig());
    setActiveCoins(coinsWithActiveSwaps());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        coins: {...prev.coins, [coin]: {...prev.coins[coin], electrumx: servers}},
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

  const save = async () => {
    if (!config) {
      return;
    }
    fail('');
    setStatus('');
    const blank = Object.entries(config.coins).find(
      ([, coin]) =>
        coin.enabled !== false &&
        coin.electrumx.some(server => !server.url.trim()),
    );
    if (blank) {
      fail(`Empty server url for ${blank[0]}`, blank[0]);
      return;
    }
    setSaving(true);
    try {
      await applyConfig(config);
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
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

        {Object.keys(config.coins).map(coin => {
          const enabled = config.coins[coin].enabled !== false;
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

        <TouchableOpacity
          testID="mbsx-settings-save"
          style={[styles.button, saving ? styles.buttonDisabled : null]}
          disabled={saving}
          onPress={save}>
          <Text style={styles.buttonText}>
            {saving ? 'Restarting…' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Revert</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setConfig(defaultConfig())}>
          <Text style={styles.buttonText}>Restore defaults</Text>
        </TouchableOpacity>
        {error !== '' && errorCoin === '' ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
        {status !== '' ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
    </View>
  );
};

export default MbsxSettings;
