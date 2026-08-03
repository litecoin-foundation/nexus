import React, {useContext, useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import MessageList from '../components/MessageList';
import {getInfo, getMemStats, getVersion, resetState} from '../adapter';
import {clearMessages} from '../mbsxSlice';
import {stringifyRpc} from '../json';
import {getMbsxStyles} from '../theme';

type ChainRow = {ticker: string; chainHeight: number};

const MbsxDebug: React.FC = () => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const dispatch = useAppDispatch();

  const running = useAppSelector(state => state.mbsx.running);
  const [connected, setConnected] = useState(false);
  const [chains, setChains] = useState<ChainRow[]>([]);

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
      const rows = Object.entries(info.coins ?? {}).map(([ticker, coin]) => ({
        ticker,
        chainHeight: coin.chain_height,
      }));
      setChains(prev =>
        prev.length === rows.length &&
        prev.every(
          (p, i) =>
            p.ticker === rows[i].ticker &&
            p.chainHeight === rows[i].chainHeight,
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

        <Text style={styles.section}>Chains</Text>
        {chains.length === 0 ? (
          <Text style={styles.empty}>No active chains</Text>
        ) : (
          chains.map(chain => (
            <View key={chain.ticker} style={styles.row}>
              <Text style={styles.label}>{chain.ticker}</Text>
              <Text style={styles.value}>{String(chain.chainHeight)}</Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            const rv = resetState();
            if (rv.error) {
              console.error('mbsx resetState failed:', rv.error);
            }
            dispatch(clearMessages());
          }}>
          <Text style={styles.buttonText}>Reset state</Text>
        </TouchableOpacity>
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
      </View>

      <MessageList style={styles.messages} />
    </View>
  );
};

export default MbsxDebug;
