import React, {useCallback, useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';

import {ROW_BORDER} from '../../../components/GlassTxRows';
import type {NewWalletStackParamList} from '../../../navigation/types';
import {useAppSelector} from '../../../store/hooks';
import {
  FinishedSwap,
  isTerminalState,
  onMessage,
  readFinishedSwaps,
  rememberFinishedSwaps,
  walletSwaps,
} from '../adapter';
import {formatExpiry} from '../format';
import {swapStateText} from '../stateText';
import {colors} from '../theme';
import {isSwapComplete, walletTitle} from '../walletText';
import CoinPair from './CoinPair';

const WALLET_FINISHED = 3;

const walletRows = (rows: FinishedSwap[]) => {
  const active = rows.filter(swap => !isTerminalState(swap.state));
  const finished = rows
    .filter(swap => isTerminalState(swap.state))
    .slice(0, WALLET_FINISHED);
  return [...active, ...finished];
};

const SwapRow = ({
  swap,
  onPress,
  onOpenRequest,
}: {
  swap: FinishedSwap;
  onPress: () => void;
  onOpenRequest: (requestId: string) => void;
}) => {
  const ended = isTerminalState(swap.state);
  const complete = isSwapComplete(swap.state);
  const muted = ended && !complete;
  const title = walletTitle(swap.state);
  const sentence = swapStateText(swap.state, swap.coin_from, swap.coin_to);
  return (
    <TouchableOpacity
      testID={`mbsx-wallet-swap-${swap.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sentence}`}
      style={styles.row}
      onPress={onPress}
      onLongPress={
        ended
          ? () => {
              Alert.alert(title, undefined, [
                {
                  text: 'Copy Swap ID',
                  onPress: () => Clipboard.setString(swap.id),
                },
                ...(swap.request_id
                  ? [
                      {
                        text: 'Open Request',
                        onPress: () => onOpenRequest(swap.request_id),
                      },
                    ]
                  : []),
                {text: 'Cancel', style: 'cancel'},
              ]);
            }
          : undefined
      }>
      <CoinPair from={swap.coin_from} to={swap.coin_to} size={36} />
      <View style={styles.mid}>
        {complete ? (
          <Text style={styles.got} numberOfLines={1}>
            {`+ ${swap.amount_to} ${swap.coin_to}`}
          </Text>
        ) : (
          <Text
            style={[styles.title, muted ? styles.mutedText : null]}
            numberOfLines={1}>
            {title}
          </Text>
        )}
        {complete ? (
          <Text style={styles.status} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <Text style={styles.sub} numberOfLines={2}>
            {sentence}
          </Text>
        )}
      </View>
      <View style={styles.amounts}>
        {complete ? null : (
          <Text
            style={[styles.in, muted ? styles.mutedText : null]}
            numberOfLines={1}>
            {`+ ${swap.amount_to} ${swap.coin_to}`}
          </Text>
        )}
        <Text style={styles.out} numberOfLines={1}>
          {`− ${swap.amount_from} ${swap.coin_from}`}
        </Text>
        <Text style={styles.when} numberOfLines={1}>
          {formatExpiry(swap.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const SwapHistoryPreview = () => {
  const running = useAppSelector(state => state.mbsx.running);
  const navigation = useNavigation<NavigationProp<NewWalletStackParamList>>();
  const [swaps, setSwaps] = useState<FinishedSwap[]>([]);

  const load = useCallback(() => {
    const live = walletSwaps();
    if (live) {
      setSwaps(walletRows(live));
      void rememberFinishedSwaps();
      return;
    }
    readFinishedSwaps().then(rows => setSwaps(walletRows(rows)));
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

  const open = (swapId: string) =>
    navigation.navigate('MbsxStack', {
      screen: 'SwapDetail',
      params: {swapId},
      initial: false,
    });
  const openRequest = (requestId: string) =>
    navigation.navigate('MbsxStack', {
      screen: 'RequestDetail',
      params: {requestId},
      initial: false,
    });

  return (
    <>
      {swaps.map(swap => (
        <SwapRow
          key={swap.id}
          swap={swap}
          onPress={() => open(swap.id)}
          onOpenRequest={openRequest}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ROW_BORDER,
  },
  mid: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
    flexShrink: 1,
  },
  got: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#1162E6',
    fontSize: 16,
  },
  status: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    color: colors.textSecondary,
    fontSize: 12,
  },
  sub: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    color: colors.textSecondary,
    fontSize: 12,
  },
  mutedText: {
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontSize: 13,
  },
  when: {
    marginTop: 4,
    fontFamily: 'Satoshi Variable',
    color: colors.grayMedium,
    fontSize: 11,
  },
});

export default SwapHistoryPreview;
