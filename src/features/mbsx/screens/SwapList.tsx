import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {triggerLightFeedback} from '../../../utils/haptic';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {
  describeRemoval,
  isTerminalState,
  listSwaps,
  onMessage,
  removeRequests,
  requestFinished,
  reservedBalance,
  sortNewestFirst,
} from '../adapter';
import {coinString} from '../useSwapAmounts';
import RemoveButton from '../components/RemoveButton';
import {formatExpiry, kindLabel} from '../format';
import CoinPair from '../components/CoinPair';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import {swapCards} from '../swapCards';
import {swapStateText, useShowRawStates} from '../stateText';
import {walletTitle} from '../walletText';
import type {MbsxDrawerParamList, SwapSummary} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapList'>;

const SwapList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();

  const running = useAppSelector(state => state.mbsx.running);
  const error = useAppSelector(state => state.mbsx.error);
  const showRaw = useShowRawStates();
  const [swaps, setSwaps] = useState<SwapSummary[]>([]);
  const [reserved, setReserved] = useState<bigint | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'finished' | 'failed'>(
    'all',
  );

  const fetchSwaps = useCallback(() => {
    const rows = listSwaps();
    if (rows) {
      setSwaps(rows);
    }
    if (!running) {
      setReserved(null);
      return;
    }
    reservedBalance()
      .then(setReserved)
      .catch(() => setReserved(null));
  }, [running]);

  useFocusEffect(fetchSwaps);

  // Refetches when `running` flips, since the first focus happens while the
  // core is still starting and reads nothing.
  useEffect(() => {
    fetchSwaps();
    const subscription = onMessage(fetchSwaps);
    return () => subscription.remove();
  }, [fetchSwaps, running]);

  const sorted = sortNewestFirst(swaps);
  const failedState = (state: string) =>
    isTerminalState(state) && state !== 'COMPLETED';
  const shown = sorted.filter(swap => {
    if (filter === 'active') {
      return !isTerminalState(swap.state);
    }
    if (filter === 'finished') {
      return swap.state === 'COMPLETED';
    }
    if (filter === 'failed') {
      return failedState(swap.state);
    }
    return true;
  });
  const chips: {id: typeof filter; label: string}[] = [
    {id: 'all', label: 'All'},
    {id: 'active', label: 'Active'},
    {id: 'finished', label: 'Finished'},
    {id: 'failed', label: 'Failed'},
  ];

  return (
    <View style={styles.container}>
      {/* Outside the ScrollView, so the section's main action stays put however
          long the list gets. */}
      <View style={styles.headerAction}>
        <TouchableOpacity
          testID="mbsx-new-swap"
          style={[
            styles.button,
            !running ? styles.buttonDisabled : null,
          ]}
          disabled={!running}
          onPress={() => navigation.navigate('CreateSwap')}>
          <Text style={styles.buttonText}>New Swap</Text>
        </TouchableOpacity>
        {/* Removes the request each finished swap belongs to, since a swap on
            its own leaves the request that funded it behind. */}
        <RemoveButton
          testID="mbsx-remove-finished"
          label="Remove finished"
          confirm="Permanently delete every finished swap and the requests they belong to?"
          disabled={!running}
          onConfirm={async () => {
            const rv = await removeRequests(requestFinished);
            fetchSwaps();
            return describeRemoval(rv, 'Nothing finished to remove');
          }}
        />
      </View>
      {reserved !== null && reserved > 0n ? (
        <Text style={styles.empty}>
          {`Reserved for swaps: ${coinString(Number(reserved) / 1e8)} LTC`}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSwaps();
              setRefreshing(false);
            }}
          />
        }>
        <View style={styles.chipRow}>
          {chips.map(chip => {
            const on = filter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                testID={`mbsx-swap-filter-${chip.id}`}
                style={[styles.chip, on ? styles.chipSelected : null]}
                onPress={() => setFilter(chip.id)}>
                <Text style={[styles.chipText, on ? styles.chipTextSelected : null]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {shown.length === 0 ? (
          running ? (
            <View style={swapCards.card}>
              <Text style={swapCards.note}>
                {filter === 'all' ? 'No swaps yet' : 'Nothing here'}
              </Text>
              {filter === 'all' ? (
                <TouchableOpacity
                  testID="mbsx-empty-new-swap"
                  onPress={() => {
                    triggerLightFeedback();
                    navigation.navigate('CreateSwap');
                  }}>
                  <Text style={swapCards.link}>New Swap</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null
        ) : (
          shown.map(swap => {
            const title = walletTitle(swap.state);
            const sentence = swapStateText(
              swap.state,
              swap.coin_from,
              swap.coin_to,
            );
            return (
            <TouchableOpacity
              key={swap.id}
              style={swapCards.card}
              onPress={() =>
                navigation.navigate('SwapDetail', {swapId: swap.id})
              }>
              <View style={swapCards.historyRow}>
                <CoinPair from={swap.coin_from} to={swap.coin_to} />
                <View style={swapCards.historyMid}>
                  <Text style={swapCards.historyTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  {sentence.toLowerCase() === title.toLowerCase() ? null : (
                    <Text style={swapCards.historySub} numberOfLines={2}>
                      {sentence}
                    </Text>
                  )}
                  {showRaw ? (
                    <Text style={swapCards.historySub}>{swap.state}</Text>
                  ) : null}
                  {swap.kind ? (
                    <Text style={swapCards.historySub}>
                      {kindLabel(swap.kind)}
                    </Text>
                  ) : null}
                  <Text style={swapCards.historySub} numberOfLines={1}>
                    {swap.id}
                  </Text>
                </View>
                <View style={swapCards.historyAmounts}>
                  <Text style={swapCards.historyIn} numberOfLines={1}>
                    {`+ ${swap.amount_to} ${swap.coin_to}`}
                  </Text>
                  <Text style={swapCards.historyOut} numberOfLines={1}>
                    {`− ${swap.amount_from} ${swap.coin_from}`}
                  </Text>
                  <TimeLine
                    align="end"
                    text={formatExpiry(swap.created_at)}
                    textStyle={swapCards.historyOut}
                  />
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default SwapList;
