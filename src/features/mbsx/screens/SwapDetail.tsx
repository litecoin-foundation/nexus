import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {formatTimestamp, kindLabel} from '../format';
import {getMbsxStyles} from '../theme';
import MbsxBackButton from '../components/MbsxBackButton';
import {
  BUSY,
  displayTxid,
  getSwapInfo,
  isTerminalState,
  onMessage,
  removeSwap,
} from '../adapter';
import RemoveButton from '../components/RemoveButton';
import CoinPair from '../components/CoinPair';
import SwapProgress from '../components/SwapProgress';
import {useAppSelector} from '../../../store/hooks';
import {COIN_ICONS, swapCards} from '../swapCards';
import {swapStateText, useShowRawStates} from '../stateText';
import type {MbsxDrawerParamList, SwapDetails, SwapEvent} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapDetail'>;

const copyLinkedId = (isTx: boolean, linkedId: string): void => {
  const value = isTx ? displayTxid(linkedId) : String(linkedId);
  Clipboard.setString(value);
  Alert.alert('Copied', value);
};

const SwapDetail: React.FC<Props> = ({route, navigation}) => {
  const {swapId} = route.params;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const showRaw = useShowRawStates();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <MbsxBackButton onPress={() => navigation.goBack()} />,
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation]);

  const [swap, setSwap] = useState<SwapDetails | null>(null);
  const [openEvent, setOpenEvent] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const fetchSwap = useCallback(() => {
    const rv = getSwapInfo(swapId);
    if (!rv || rv.error === BUSY) {
      return;
    }
    if (rv.error) {
      navigation.navigate('SwapList');
      return;
    }
    setSwap(rv);
  }, [swapId, navigation]);

  const running = useAppSelector(state => state.mbsx.running);
  useFocusEffect(
    useCallback(() => {
      if (!running) {
        return;
      }
      fetchSwap();
      const subscription = onMessage(fetchSwap);
      return () => subscription.remove();
    }, [fetchSwap, running]),
  );

  if (!swap) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>
          {running ? 'No swap selected' : 'Starting…'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={swapCards.card}>
          <View style={swapCards.historyRow}>
            <CoinPair from={swap.coin_from} to={swap.coin_to} size={40} />
            <View style={swapCards.historyMid}>
              <Text style={swapCards.historyTitle}>
                {swapStateText(swap.state, swap.coin_from, swap.coin_to)}
              </Text>
              {showRaw ? (
                <Text style={swapCards.historySub}>{swap.state}</Text>
              ) : null}
            </View>
          </View>
          <SwapProgress state={swap.state} expireAt={swap.expire_at} />
        </View>
        <Text style={swapCards.section}>Send</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            <Text style={swapCards.amount} numberOfLines={1} adjustsFontSizeToFit>
              {swap.amount_from}
            </Text>
            <View style={swapCards.coinPill}>
              {COIN_ICONS[swap.coin_from] ? (
                <Image
                  source={COIN_ICONS[swap.coin_from]}
                  style={swapCards.coinLogo}
                />
              ) : null}
              <Text style={swapCards.coinPillText}>{swap.coin_from}</Text>
            </View>
          </View>
          {swap.kind ? (
            <Text style={swapCards.meta}>{kindLabel(swap.kind)}</Text>
          ) : null}
          <Text style={swapCards.fromLine}>
            {`Created ${formatTimestamp(swap.created_at)}`}
          </Text>
          <TouchableOpacity
            testID="mbsx-swap-request"
            onPress={() =>
              navigation.navigate('RequestDetail', {requestId: swap.request_id})
            }>
            <Text style={swapCards.link}>View request</Text>
          </TouchableOpacity>
        </View>

        <View style={swapCards.flipWrap}>
          <View style={swapCards.flipLine} />
          <View style={swapCards.flip}>
            <Image
              source={require('../../../assets/icons/switch-arrow.png')}
              style={swapCards.flipIcon}
            />
          </View>
        </View>

        <Text style={swapCards.section}>Receive</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            <Text style={swapCards.amount} numberOfLines={1} adjustsFontSizeToFit>
              {swap.amount_to}
            </Text>
            <View style={swapCards.coinPill}>
              {COIN_ICONS[swap.coin_to] ? (
                <Image source={COIN_ICONS[swap.coin_to]} style={swapCards.coinLogo} />
              ) : null}
              <Text style={swapCards.coinPillText}>{swap.coin_to}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={swapCards.advancedToggle}
          onPress={() => setAdvanced(open => !open)}>
          <Text style={swapCards.advancedLabel}>Events</Text>
          <Image
            source={require('../../../assets/images/forward.png')}
            style={[swapCards.chevron, advanced ? swapCards.chevronOpen : null]}
          />
        </TouchableOpacity>
        {advanced ? (
          (swap.events ?? []).length === 0 ? (
            <View style={swapCards.card}>
              <Text style={swapCards.note}>No events</Text>
            </View>
          ) : (
            (swap.events ?? []).map((event: SwapEvent) => {
              const expanded = openEvent === event.id;
              // The module holds txids in internal byte order; explorers and people
              // read the other way round.
              const isTx = event.linked_type === 'SWAP_TX';
              const stepText = swapStateText(
                event.event_sub_type,
                swap.coin_from,
                swap.coin_to,
              );
              return (
                <TouchableOpacity
                  key={event.id}
                  testID={`mbsx-event-${event.id}`}
                  style={swapCards.card}
                  onPress={() => setOpenEvent(expanded ? null : event.id)}>
                  <Text style={styles.rowPrimary}>
                    {stepText !== event.event_sub_type
                      ? stepText
                      : `${event.event_type}${
                          event.event_sub_type ? `: ${event.event_sub_type}` : ''
                        }`}
                  </Text>
                  {showRaw && event.event_sub_type ? (
                    <Text style={swapCards.id}>{String(event.event_sub_type)}</Text>
                  ) : null}
                  <Text style={styles.rowSecondary}>{event.time}</Text>
                  {(event.event_msg ?? event.event_data) ? (
                    <Text style={styles.rowMessage}>
                      {String(event.event_msg ?? event.event_data)}
                    </Text>
                  ) : null}
                  {expanded && event.linked_id ? (
                    <>
                      <Text style={styles.rowSecondary}>
                        {isTx ? 'Transaction' : String(event.linked_type)}
                      </Text>
                      <TouchableOpacity
                        testID={`mbsx-copy-${event.id}`}
                        onPress={() => copyLinkedId(isTx, event.linked_id)}>
                        <Text selectable style={styles.rowMessage}>
                          {isTx ? displayTxid(event.linked_id) : event.linked_id}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  {expanded &&
                  event.event_msg !== undefined &&
                  event.event_data !== undefined ? (
                    <Text style={styles.rowMessage}>
                      {String(event.event_data)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )
        ) : null}

        <Text style={swapCards.id} selectable>
          {swap.id}
        </Text>

        {/* Removes this swap alone; the request that funded it stays. */}
        {isTerminalState(swap.state) ? (
          <RemoveButton
            testID="mbsx-remove-swap"
            label="Delete swap"
            confirm="Permanently delete this swap and its events?"
            onConfirm={async () => {
              removeSwap(swapId);
              navigation.navigate('SwapList');
              return 'Removed';
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
};

export default SwapDetail;
