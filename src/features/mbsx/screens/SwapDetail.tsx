import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
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
import {coinString} from '../useSwapAmounts';
import {isSwapComplete, walletTitle} from '../walletText';
import type {MbsxDrawerParamList, SwapDetails, SwapEvent} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapDetail'>;

const REFUND_TX = [
  'Lock A Refund Spend',
  'Lock A pre-Refund',
  'Lock B Refund',
  'Lock A Refund Swipe',
];

const refundTxid = (events: SwapEvent[] | undefined): string => {
  const hit = (events ?? [])
    .filter(
      event =>
        event.linked_type === 'SWAP_TX' &&
        typeof event.linked_id === 'string' &&
        REFUND_TX.includes(String(event.event_data)),
    )
    .sort(
      (a, b) =>
        REFUND_TX.indexOf(String(a.event_data)) -
        REFUND_TX.indexOf(String(b.event_data)),
    )[0];
  return hit?.linked_id ? displayTxid(String(hit.linked_id)) : '';
};

const CoinAmount = ({amount, coin}: {amount: string; coin: string}) => (
  <View style={swapCards.historyRow}>
    {COIN_ICONS[coin] ? (
      <Image source={COIN_ICONS[coin]} style={swapCards.coinLogo} />
    ) : null}
    <Text style={swapCards.historyTitle}>{`${amount} ${coin}`}</Text>
  </View>
);

const Flip = () => (
  <View style={swapCards.flipWrap}>
    <View style={swapCards.flipLine} />
    <View style={swapCards.flip}>
      <Image
        source={require('../../../assets/icons/switch-arrow.png')}
        style={swapCards.flipIcon}
      />
    </View>
  </View>
);

const CopyField = ({testID, value}: {testID: string; value: string}) => (
  <View style={look.addressRow}>
    <View style={look.addressBox}>
      <Text style={look.address} selectable>
        {value}
      </Text>
    </View>
    <TouchableOpacity
      testID={testID}
      accessibilityLabel="Copy"
      style={look.iconBtn}
      onPress={() => Clipboard.setString(value)}>
      <Image
        source={require('../../../assets/icons/copy-icon.png')}
        style={look.toolIcon}
      />
    </TouchableOpacity>
  </View>
);

const SwapFees = ({swap}: {swap: SwapDetails}) => {
  const fees = swap.fees ?? [];
  const show =
    fees.length > 0 ||
    Boolean(swap.chain_fee_from) ||
    Boolean(swap.chain_fee_to);
  if (!show) {
    return null;
  }
  const bps = fees.reduce((sum, fee) => sum + Number(fee.bps), 0);
  const chains: [string, string | undefined, bigint][] = [
    [swap.coin_from, swap.chain_fee_from, swap.fee_rate_from],
    [swap.coin_to, swap.chain_fee_to, swap.fee_rate_to],
  ];
  return (
    <>
      <Text style={swapCards.section}>Fees</Text>
      <View style={swapCards.card}>
        {fees.map((fee, index) => (
          <View
            key={fee.desc}
            style={[look.feeRow, index > 0 ? look.feeLine : null]}>
            <Text style={look.feeLabel}>{fee.desc}</Text>
            <Text style={look.feePct}>{`${Number(fee.bps) / 100}%`}</Text>
            <Text style={look.feeValue}>
              {`${fee.amount} ${swap.fees_coin ?? ''}`}
            </Text>
          </View>
        ))}
        {fees.length > 0 ? (
          <View style={[look.feeRow, look.feeTotal]}>
            <Text style={look.feeTotalLabel}>Total</Text>
            <Text style={look.feePct}>{`${bps / 100}%`}</Text>
            <Text testID="mbsx-receipt-fee" style={look.feeTotalValue}>
              {`${swap.fees_total ?? ''} ${swap.fees_coin ?? ''}`}
            </Text>
          </View>
        ) : null}
        {chains.map(([coin, amount, rate]) => (
          <View key={coin} style={[look.feeRow, look.feeLine]}>
            <Text style={look.feeLabel}>{`Chain fee ${coin}`}</Text>
            <Text style={look.feeRate}>{`${rate} sat/kvB`}</Text>
            <Text style={look.feeValue}>{`~${amount ?? '?'}`}</Text>
          </View>
        ))}
      </View>
    </>
  );
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
  const destinations = useAppSelector(
    state => state.mbsxAddresses.destinations,
  );
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
        <Text style={styles.empty}>No swap selected</Text>
      </View>
    );
  }

  if (isTerminalState(swap.state)) {
    const complete = isSwapComplete(swap.state);
    const sent = Number(swap.amount_from);
    const received = Number(swap.amount_to);
    const rate =
      sent > 0 && received > 0
        ? `1 ${swap.coin_from} ≈ ${coinString(received / sent)} ${swap.coin_to}`
        : '';
    const address = destinations?.[swap.request_id] ?? '';
    const refund = refundTxid(swap.events);
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={swapCards.card}>
            <View style={swapCards.historyRow}>
              <CoinPair from={swap.coin_from} to={swap.coin_to} size={40} />
              <View style={swapCards.historyMid}>
                <Text style={swapCards.historyTitle}>
                  {walletTitle(swap.state)}
                </Text>
                {complete ? null : (
                  <Text style={swapCards.historySub}>
                    {swapStateText(swap.state, swap.coin_from, swap.coin_to)}
                  </Text>
                )}
                <Text style={swapCards.historySub}>
                  {formatTimestamp(swap.created_at)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={swapCards.section}>Sent</Text>
          <View style={swapCards.card}>
            <CoinAmount amount={swap.amount_from} coin={swap.coin_from} />
          </View>
          <Flip />
          <Text style={swapCards.section}>Received</Text>
          <View style={swapCards.card}>
            <CoinAmount amount={swap.amount_to} coin={swap.coin_to} />
            {rate ? (
              <Text testID="mbsx-receipt-rate" style={swapCards.meta}>
                {rate}
              </Text>
            ) : null}
          </View>
          <SwapFees swap={swap} />
          {address ? (
            <>
              <Text style={swapCards.section}>Receive Address</Text>
              <View style={swapCards.card}>
                <CopyField testID="mbsx-receipt-address" value={address} />
              </View>
            </>
          ) : null}
          {refund ? (
            <>
              <Text style={swapCards.section}>Refund Transaction</Text>
              <View style={swapCards.card}>
                <CopyField testID="mbsx-receipt-refund" value={refund} />
              </View>
            </>
          ) : null}
          <TouchableOpacity
            testID="mbsx-receipt-done"
            style={styles.button}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
          {complete ? null : (
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
          )}
        </ScrollView>
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
          <CoinAmount amount={swap.amount_from} coin={swap.coin_from} />
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

        <Flip />

        <Text style={swapCards.section}>Receive</Text>
        <View style={swapCards.card}>
          <CoinAmount amount={swap.amount_to} coin={swap.coin_to} />
          {Number(swap.amount_from) > 0 && Number(swap.amount_to) > 0 ? (
            <Text style={swapCards.meta}>
              {`1 ${swap.coin_from} ≈ ${coinString(
                Number(swap.amount_to) / Number(swap.amount_from),
              )} ${swap.coin_to}`}
            </Text>
          ) : null}
        </View>
        <SwapFees swap={swap} />

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
                  <Text style={swapCards.historyTitle}>
                    {stepText !== event.event_sub_type
                      ? stepText
                      : `${event.event_type}${
                          event.event_sub_type ? `: ${event.event_sub_type}` : ''
                        }`}
                  </Text>
                  {showRaw && event.event_sub_type ? (
                    <Text style={swapCards.id}>{String(event.event_sub_type)}</Text>
                  ) : null}
                  <Text style={swapCards.historySub}>
                    {event.time ??
                      (event.created_at
                        ? formatTimestamp(String(event.created_at))
                        : '')}
                  </Text>
                  {(event.event_msg ?? event.event_data) ? (
                    <Text style={swapCards.meta}>
                      {String(event.event_msg ?? event.event_data)}
                    </Text>
                  ) : null}
                  {expanded && event.linked_id ? (
                    <View style={look.eventCopy}>
                      <Text style={swapCards.historySub}>
                        {isTx ? 'Transaction' : String(event.linked_type)}
                      </Text>
                      <CopyField
                        testID={`mbsx-copy-${event.id}`}
                        value={
                          isTx
                            ? displayTxid(event.linked_id)
                            : String(event.linked_id)
                        }
                      />
                    </View>
                  ) : null}
                  {expanded &&
                  event.event_msg !== undefined &&
                  event.event_data !== undefined ? (
                    <Text style={swapCards.meta}>{String(event.event_data)}</Text>
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

const look = StyleSheet.create({
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressBox: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  address: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#484859',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  toolIcon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
  eventCopy: {
    marginTop: 8,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  feeLine: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  feeLabel: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#484859',
  },
  feePct: {
    width: 56,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: '#747E87',
  },
  feeRate: {
    marginLeft: 8,
    fontFamily: 'Satoshi Variable',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'right',
  },
  feeValue: {
    minWidth: 88,
    marginLeft: 8,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#484859',
  },
  feeTotal: {
    borderTopWidth: 1,
    borderTopColor: '#D5DBE4',
    marginTop: 2,
  },
  feeTotalLabel: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#484859',
  },
  feeTotalValue: {
    minWidth: 88,
    marginLeft: 8,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#484859',
  },
});

export default SwapDetail;
