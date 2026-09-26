import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useAppSelector} from '../../../store/hooks';
import {
  FinishedSwap,
  isRunning,
  listSwaps,
  onMessage,
  readFinishedSwaps,
  rememberFinishedSwaps,
} from '../adapter';
import BasicSwapMark from './BasicSwapMark';
import CoinPair from './CoinPair';

const completedNow = (): FinishedSwap[] | null => {
  if (!isRunning()) {
    return null;
  }
  const swaps = listSwaps();
  if (swaps === null) {
    return null;
  }
  return swaps
    .filter(swap => swap.state === 'COMPLETED')
    .map(swap => ({
      id: swap.id,
      coin_from: swap.coin_from,
      coin_to: swap.coin_to,
      amount_from: swap.amount_from,
      amount_to: swap.amount_to,
      state: swap.state,
      created_at: swap.created_at,
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
};

const SwapRow = ({swap}: {swap: FinishedSwap}) => (
  <View style={styles.row}>
    <CoinPair from={swap.coin_from} to={swap.coin_to} size={36} />
    <View style={styles.mid}>
      <Text style={styles.title} numberOfLines={2}>
        Swap Complete
      </Text>
      <BasicSwapMark width={78} align="left" />
    </View>
    <View style={styles.amounts}>
      <Text style={styles.in} numberOfLines={1}>
        {`+ ${swap.amount_to} ${swap.coin_to}`}
      </Text>
      <Text style={styles.out} numberOfLines={1}>
        {`− ${swap.amount_from} ${swap.coin_from}`}
      </Text>
    </View>
  </View>
);

const SwapHistoryPreview = () => {
  const running = useAppSelector(state => state.mbsx.running);
  const [swaps, setSwaps] = useState<FinishedSwap[]>([]);

  const load = useCallback(() => {
    const live = completedNow();
    if (live) {
      setSwaps(live);
      void rememberFinishedSwaps();
      return;
    }
    readFinishedSwaps().then(setSwaps);
  }, []);

  useEffect(() => {
    load();
    const subscription = onMessage(load);
    const id = setInterval(load, 2000);
    return () => {
      subscription.remove();
      clearInterval(id);
    };
  }, [load, running]);

  if (swaps.length === 0) {
    return null;
  }

  return (
    <>
      {swaps.map(swap => (
        <SwapRow key={swap.id} swap={swap} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
  },
  mid: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 15,
    marginBottom: 4,
  },
  amounts: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  in: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#1162E6',
    fontSize: 13,
  },
  out: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
  },
});

export default SwapHistoryPreview;
