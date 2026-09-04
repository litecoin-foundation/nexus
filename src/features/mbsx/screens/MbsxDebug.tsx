import React, {useContext, useEffect, useState} from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import MessageList from '../components/MessageList';
import {getInfo, getMemStats, getVersion, resetState} from '../adapter';
import {readConfig} from '../adapter/config';
import {getNetwork} from '../network';
import {clearMessages} from '../mbsxSlice';
import {EXPORT_CONTENTS, exportLogs} from '../exportLogs';
import {stringifyRpc} from '../json';
import {getMbsxStyles} from '../theme';

type ChainRow = {ticker: string; chainHeight: number; bridged: boolean};

const MbsxDebug: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const dispatch = useAppDispatch();

  const running = useAppSelector(state => state.mbsx.running);
  const messages = useAppSelector(state => state.mbsx.messages);
  const [connected, setConnected] = useState(false);
  const [dbVersion, setDbVersion] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [chains, setChains] = useState<ChainRow[]>([]);
  // Disabled coins never reach getInfo, so their rows come from the config.
  const [disabledCoins, setDisabledCoins] = useState<string[]>([]);
  const canReset = getNetwork() === 'regtest';

  useEffect(() => {
    readConfig().then(cfg => {
      setDisabledCoins(
        Object.entries(cfg?.coins ?? {})
          .filter(([, coin]) => coin.enabled === false)
          .map(([ticker]) => ticker.toUpperCase()),
      );
    });
  }, []);

  // Polled rather than driven by onMessage so heights keep updating while the
  // module is idle. Unchanged values reuse the previous array, so a tick that
  // finds no new block does not re-render.
  useEffect(() => {
    const refresh = () => {
      const info = getInfo();
      if (!info) {
        setConnected(false);
        setChains(prev => (prev.length === 0 ? prev : []));
        return;
      }
      setConnected(Boolean(info.connected));
      setDbVersion(info.db_version ?? null);
      const rows = Object.entries(info.coins ?? {}).map(([ticker, coin]) => ({
        ticker,
        chainHeight: coin.chain_height,
        bridged: coin.bridge_supported !== false,
      }));
      setChains(prev =>
        prev.length === rows.length &&
        prev.every(
          (p, i) =>
            p.ticker === rows[i].ticker &&
            p.chainHeight === rows[i].chainHeight &&
            p.bridged === rows[i].bridged,
        )
          ? prev
          : rows,
      );
    };
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.scroll}>
        <View style={styles.row}>
          <Text style={styles.label}>Native</Text>
          <Text style={styles.value}>{getVersion()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Running</Text>
          <Text style={styles.value}>{String(running)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bridge</Text>
          <Text style={styles.value}>
            {connected ? 'connected' : 'disconnected'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>DB version</Text>
          <Text style={styles.value}>{dbVersion ?? '-'}</Text>
        </View>

        <Text style={styles.section}>Chains</Text>
        {chains.length === 0 && disabledCoins.length === 0 ? (
          <Text style={styles.empty}>No active chains</Text>
        ) : (
          <>
            {chains.map(chain => (
              <View key={chain.ticker} style={styles.row}>
                <Text style={styles.label}>{chain.ticker}</Text>
                <Text style={styles.value}>
                  {String(chain.chainHeight)}
                  {chain.bridged ? '' : ' (no bridge)'}
                </Text>
              </View>
            ))}
            {disabledCoins.map(ticker => (
              <View key={ticker} style={styles.row}>
                <Text style={styles.label}>{ticker}</Text>
                <Text style={styles.value}>disabled</Text>
              </View>
            ))}
          </>
        )}

        {canReset ? (
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const rv = await resetState();
              if (rv.error) {
                console.error('mbsx resetState failed:', rv.error);
              }
              dispatch(clearMessages());
            }}>
            <Text style={styles.buttonText}>Reset state</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // Logged rather than rendered: this is for diffing successive
            // samples in logcat, and polling it would add churn to what it
            // measures.
            console.log('MEMSTATS ' + stringifyRpc(getMemStats()));
          }}>
          <Text style={styles.buttonText}>Log mem stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          disabled={exporting}
          onPress={() => {
            // Asked before the file is written, not after: the point of the
            // share sheet is that the user chooses the recipient, and that is
            // only a choice if they know what is in it first.
            Alert.alert(
              'Export debug report',
              `The report includes:\n\n${EXPORT_CONTENTS.map(
                s => `• ${s}`,
              ).join('\n')}\n\nIt contains no keys and no seed phrase, and is ` +
                'not sent anywhere - you choose who receives it.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Export',
                  onPress: async () => {
                    setExporting(true);
                    try {
                      await exportLogs(messages);
                    } catch (e) {
                      Alert.alert('Export failed', (e as Error).message);
                    } finally {
                      setExporting(false);
                    }
                  },
                },
              ],
            );
          }}>
          <Text style={styles.buttonText}>
            {exporting ? 'Exporting…' : 'Export logs'}
          </Text>
        </TouchableOpacity>
      </View>

      <MessageList style={styles.messages} />
    </View>
  );
};

export default MbsxDebug;
