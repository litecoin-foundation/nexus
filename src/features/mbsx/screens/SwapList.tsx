import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';
import {listSwaps, onMessage} from '../adapter';
import type {MbsxStackParamList, SwapSummary} from '../types';

type Props = StackScreenProps<MbsxStackParamList, 'SwapList'>;

const SwapList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [swaps, setSwaps] = useState<SwapSummary[]>([]);

  const fetchSwaps = useCallback(() => {
    const rows = listSwaps();
    if (rows) {
      setSwaps(rows);
    }
  }, []);

  useFocusEffect(fetchSwaps);

  useEffect(() => {
    const subscription = onMessage(fetchSwaps);
    return () => subscription.remove();
  }, [fetchSwaps]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {swaps.length === 0 ? (
          <Text style={styles.empty}>No swaps</Text>
        ) : (
          swaps.map(swap => (
            <TouchableOpacity
              key={swap.id}
              style={styles.row}
              onPress={() =>
                navigation.navigate('SwapDetail', {swapId: swap.id})
              }>
              <Text style={styles.coins}>
                {swap.coin_from} → {swap.coin_to}
              </Text>
              <Text style={styles.value}>{swap.state}</Text>
              <Text style={styles.value}>{swap.id.slice(0, 8)}…</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default SwapList;
