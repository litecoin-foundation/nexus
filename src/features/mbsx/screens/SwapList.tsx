import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {listSwaps, onMessage} from '../adapter';
import type {MbsxDrawerParamList, SwapSummary} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapList'>;

const SwapList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const running = useAppSelector(state => state.mbsx.running);
  const error = useAppSelector(state => state.mbsx.error);
  const [swaps, setSwaps] = useState<SwapSummary[]>([]);

  const fetchSwaps = useCallback(() => {
    const rows = listSwaps();
    if (rows) {
      setSwaps(rows);
    }
  }, []);

  useFocusEffect(fetchSwaps);

  // Refetches when `running` flips, since the first focus happens while the
  // core is still starting and reads nothing.
  useEffect(() => {
    fetchSwaps();
    const subscription = onMessage(fetchSwaps);
    return () => subscription.remove();
  }, [fetchSwaps, running]);

  return (
    <View style={styles.container}>
      {/* Outside the ScrollView, so the section's main action stays put however
          long the list gets. */}
      <View style={styles.headerAction}>
        <TouchableOpacity
          testID="mbsx-new-swap"
          style={[styles.button, !running ? styles.buttonDisabled : null]}
          disabled={!running}
          onPress={() => navigation.navigate('CreateSwap')}>
          <Text style={styles.buttonText}>New swap</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!running && !error ? <Text style={styles.empty}>Starting…</Text> : null}
      <ScrollView contentContainerStyle={styles.scroll}>
        {swaps.length === 0 ? (
          running ? (
            <Text style={styles.empty}>No swaps</Text>
          ) : null
        ) : (
          swaps.map(swap => (
            <TouchableOpacity
              key={swap.id}
              style={styles.stackedRow}
              onPress={() =>
                navigation.navigate('SwapDetail', {swapId: swap.id})
              }>
              <Text style={styles.rowPrimary}>
                {swap.coin_from} → {swap.coin_to} · {swap.state}
              </Text>
              <Text style={styles.rowSecondary}>{swap.id}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default SwapList;
