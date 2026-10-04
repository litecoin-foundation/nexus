import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import MessageList from '../components/MessageList';
import {
  getInfo,
  getMemStats,
  getSqliteVersion,
  getVersion,
  resetState,
} from '../adapter';
import {readConfig} from '../adapter/config';
import {getNetwork} from '../network';
import {clearMessages} from '../mbsxSlice';
import {EXPORT_CONTENTS, exportLogs} from '../exportLogs';
import {stringifyRpc} from '../json';
import {getMbsxStyles} from '../theme';
import {useBottomInset} from '../components/useBottomInset';
import {COIN_ICONS, swapCards} from '../swapCards';

type ChainRow = {ticker: string; chainHeight: number; bridged: boolean};

const MbsxDebug: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const dispatch = useAppDispatch();

  const running = useAppSelector(state => state.mbsx.running);
  const messages = useAppSelector(state => state.mbsx.messages);
  const [connected, setConnected] = useState(false);
  const [dbVersion, setDbVersion] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [chains, setChains] = useState<ChainRow[]>([]);
  // Disabled coins never reach getInfo, so their rows come from the config.
  const [disabledCoins, setDisabledCoins] = useState<string[]>([]);
  const canReset = getNetwork() === 'regtest';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      readConfig().then(cfg => {
        if (!active) {
          return;
        }
        setDisabledCoins(
          Object.entries(cfg?.coins ?? {})
            .filter(([, coin]) => coin.enabled !== true)
            .map(([ticker]) => ticker.toUpperCase()),
        );
      });
      return () => {
        active = false;
      };
    }, []),
  );

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

  const onReset = () => {
    Alert.alert(
      'Reset State',
      'Clear the swap state on this regtest? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const rv = await resetState();
            if (rv.error) {
              setResetError(rv.error);
              console.error('mbsx resetState failed:', rv.error);
              return;
            }
            setResetError('');
            dispatch(clearMessages());
          },
        },
      ],
    );
  };

  const chainRow = (
    ticker: string,
    detail: string | null,
    value: string | null,
    lined: boolean,
  ) => (
    <View key={ticker} style={[look.chainRow, lined ? look.chainLine : null]}>
      <View style={look.coinTitle}>
        {COIN_ICONS[ticker] ? (
          <Image source={COIN_ICONS[ticker]} style={swapCards.coinLogo} />
        ) : null}
        <View style={look.coinText}>
          <Text style={styles.label}>{ticker}</Text>
          {detail ? <Text style={look.detail}>{detail}</Text> : null}
        </View>
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}
      keyboardShouldPersistTaps="handled">
      <View>
        <View style={swapCards.card}>
          <View style={look.statusRow}>
            <Text style={styles.label}>Native</Text>
            <Text style={styles.value}>{getVersion()}</Text>
          </View>
          <View style={[look.statusRow, look.chainLine]}>
            <Text style={styles.label}>SQLite</Text>
            <Text style={styles.value}>{getSqliteVersion()}</Text>
          </View>
          <View style={[look.statusRow, look.chainLine]}>
            <Text style={styles.label}>Running</Text>
            <Text style={styles.value}>{running ? 'Running' : 'Stopped'}</Text>
          </View>
          <View style={[look.statusRow, look.chainLine]}>
            <Text style={styles.label}>Bridge</Text>
            <Text style={styles.value}>
              {connected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          <View style={[look.statusRow, look.chainLine]}>
            <Text style={styles.label}>DB version</Text>
            <Text style={styles.value}>{dbVersion ?? '-'}</Text>
          </View>
        </View>

        <Text style={swapCards.section}>Chains</Text>
        <View style={swapCards.card}>
          {chains.length === 0 && disabledCoins.length === 0 ? (
            <Text style={swapCards.note}>No active chains</Text>
          ) : (
            <>
              {chains.map((chain, index) =>
                chainRow(
                  chain.ticker.toUpperCase(),
                  chain.bridged ? null : 'No bridge',
                  String(chain.chainHeight),
                  index > 0,
                ),
              )}
              {disabledCoins.map((ticker, index) =>
                chainRow(
                  ticker,
                  'Disabled',
                  null,
                  chains.length > 0 || index > 0,
                ),
              )}
            </>
          )}
        </View>

        {canReset ? (
          <TouchableOpacity style={styles.buttonSecondary} onPress={onReset}>
            <Text style={styles.buttonSecondaryText}>Reset state</Text>
          </TouchableOpacity>
        ) : null}
        {resetError !== '' ? (
          <Text testID="mbsx-reset-error" style={styles.error}>
            {resetError}
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => {
            // Logged rather than rendered: this is for diffing successive
            // samples in logcat, and polling it would add churn to what it
            // measures.
            console.log('MEMSTATS ' + stringifyRpc(getMemStats()));
          }}>
          <Text style={styles.buttonSecondaryText}>Log mem stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          disabled={exporting}
          onPress={() => {
            // Asked before the file is written, not after: the point of the
            // share sheet is that the user chooses the recipient, and that is
            // only a choice if they know what is in it first.
            Alert.alert(
              'Export Debug Report',
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
                      Alert.alert('Export Failed', (e as Error).message);
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
        <Text style={swapCards.section}>Events</Text>
        <MessageList embedded />
      </View>
    </ScrollView>
  );
};

const look = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  chainLine: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
    paddingTop: 8,
  },
  coinTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  coinText: {
    flex: 1,
  },
  detail: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
    marginTop: 2,
  },
});

export default MbsxDebug;
