import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {
  describeRemoval,
  listSwaps,
  onMessage,
  removeRequests,
  requestFinished,
  reservedBalance,
} from '../adapter';
import {coinString} from '../useSwapAmounts';
import RemoveButton from '../components/RemoveButton';
import {kindLabel} from '../format';
import {COIN_ICONS, swapCards} from '../swapCards';
import {swapStateText, useShowRawStates} from '../stateText';
import type {MbsxDrawerParamList, SwapSummary} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapList'>;

const SwapList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const running = useAppSelector(state => state.mbsx.running);
  const error = useAppSelector(state => state.mbsx.error);
  const showRaw = useShowRawStates();
  const [swaps, setSwaps] = useState<SwapSummary[]>([]);
  const [reserved, setReserved] = useState<bigint | null>(null);

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
      {!running && !error ? <Text style={styles.empty}>Starting…</Text> : null}
      <ScrollView contentContainerStyle={styles.scroll}>
        {swaps.length === 0 ? (
          running ? (
            <View style={swapCards.card}>
              <Text style={swapCards.note}>No swaps</Text>
            </View>
          ) : null
        ) : (
          swaps.map(swap => (
            <TouchableOpacity
              key={swap.id}
              style={swapCards.card}
              onPress={() =>
                navigation.navigate('SwapDetail', {swapId: swap.id})
              }>
              <View style={swapCards.pair}>
                {COIN_ICONS[swap.coin_from] ? (
                  <Image
                    source={COIN_ICONS[swap.coin_from]}
                    style={swapCards.coinLogo}
                  />
                ) : null}
                <Text style={swapCards.pairText}>
                  {`${swap.coin_from} → ${swap.coin_to}`}
                </Text>
                {COIN_ICONS[swap.coin_to] ? (
                  <Image
                    source={COIN_ICONS[swap.coin_to]}
                    style={swapCards.coinLogoEnd}
                  />
                ) : null}
              </View>
              <Text style={swapCards.status}>
                {swapStateText(swap.state, swap.coin_from, swap.coin_to)}
              </Text>
              {showRaw ? (
                <Text style={swapCards.id}>{swap.state}</Text>
              ) : null}
              {swap.kind ? (
                <Text style={swapCards.meta}>{kindLabel(swap.kind)}</Text>
              ) : null}
              <Text style={swapCards.meta}>
                {`${swap.amount_from} ${swap.coin_from}`}
              </Text>
              <Text style={swapCards.id}>{swap.id}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default SwapList;
