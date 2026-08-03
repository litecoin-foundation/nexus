import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';
import {defaultConfig, readConfig, writeConfig} from '../adapter';
import type {MbsxConfig} from '../adapter';

const MbsxSettings: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [config, setConfig] = useState<MbsxConfig | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setConfig((await readConfig()) ?? defaultConfig());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const edit = (patch: Partial<MbsxConfig>) => {
    setStatus('');
    setConfig(prev => (prev ? {...prev, ...patch} : prev));
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

  const addServer = (coin: string) => {
    setStatus('');
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
    setError('');
    setStatus('');
    const blank = Object.entries(config.coins).find(([, coin]) =>
      coin.electrumx.some(server => !server.url.trim()),
    );
    if (blank) {
      setError(`Empty server url for ${blank[0]}`);
      return;
    }
    try {
      await writeConfig(config);
      // initialise() reads config.json once, so nothing here reaches a core
      // that is already running.
      setStatus('Saved — restart swaps to apply');
    } catch (e) {
      setError((e as Error).message);
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
      <ScrollView contentContainerStyle={styles.scroll}>
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

        {Object.keys(config.coins).map(coin => (
          <View key={coin}>
            <Text style={styles.section}>{coin.toUpperCase()} servers</Text>
            {config.coins[coin].electrumx.map((server, index) => (
              <View key={index}>
                <TextInput
                  style={styles.input}
                  value={server.url}
                  placeholder="tcp://host:port"
                  onChangeText={url => editServer(coin, index, url)}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => removeServer(coin, index)}>
                  <Text style={styles.error}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.button}
              onPress={() => addServer(coin)}>
              <Text style={styles.buttonText}>Add server</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Revert</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setConfig(defaultConfig())}>
          <Text style={styles.buttonText}>Restore defaults</Text>
        </TouchableOpacity>
        {error !== '' ? <Text style={styles.error}>{error}</Text> : null}
        {status !== '' ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
    </View>
  );
};

export default MbsxSettings;
