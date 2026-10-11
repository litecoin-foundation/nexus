import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {
  feeTotalBps,
  formatExpiry,
  formatTimestamp,
  kindLabel,
  shortAddress,
  shortId,
} from '../format';
import {colors, getMbsxStyles} from '../theme';
import MbsxBackButton from '../components/MbsxBackButton';
import CopyButton, {CopyChip} from '../components/CopyButton';
import {
  abandonSwap,
  getSwapInfo,
  isTerminalState,
  onMessage,
  removeSwap,
  isGone,
} from '../adapter';
import RemoveButton from '../components/RemoveButton';
import CoinPair from '../components/CoinPair';
import SwapProgress from '../components/SwapProgress';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import {useAppSelector} from '../../../store/hooks';
import {COIN_ICONS, swapCards} from '../swapCards';
import {
  swapStateText,
  useShowDebug,
  useShowRawStates,
  useShowUtcTimes,
} from '../stateText';
import {coinString} from '../useSwapAmounts';
import {isSwapComplete, swapSides, walletTitle} from '../walletText';
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
  return hit?.linked_id ? String(hit.linked_id) : '';
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
    <CopyButton
      testID={testID}
      label="Copy"
      value={value}
      style={look.iconBtn}
    />
  </View>
);

const SwapFees = ({swap}: {swap: SwapDetails}) => {
  const [open, setOpen] = useState(false);
  const fees = swap.fees ?? [];
  const show =
    fees.length > 0 ||
    Boolean(swap.chain_fee_from) ||
    Boolean(swap.chain_fee_to);
  if (!show) {
    return null;
  }
  const bps = feeTotalBps(swap);
  const chains: [string, string | undefined, bigint][] = [
    [swap.coin_from, swap.chain_fee_from, swap.fee_rate_from],
    [swap.coin_to, swap.chain_fee_to, swap.fee_rate_to],
  ];
  return (
    <>
      <Text style={swapCards.section}>Fees</Text>
      <View style={swapCards.card}>
        {open
          ? fees.map((fee, index) => (
              <View
                key={`${index}`}
                style={[look.feeRow, index > 0 ? look.feeLine : null]}>
                <Text style={look.feeLabel}>{fee.desc}</Text>
                <Text style={look.feePct}>{`${Number(fee.bps) / 100}%`}</Text>
                <Text style={look.feeValue}>
                  {`${fee.amount} ${swap.fees_coin ?? ''}`}
                </Text>
              </View>
            ))
          : null}
        <TouchableOpacity
          testID="mbsx-swap-fees"
          accessibilityRole="button"
          accessibilityState={{expanded: open}}
          style={[look.feeRow, open && fees.length > 0 ? look.feeTotal : null]}
          onPress={() => setOpen(shown => !shown)}>
          {fees.length > 0 ? (
            <>
              <Text style={[look.feeTotalLabel, look.feeToggle]}>Total</Text>
              <Text style={look.feePct}>{`${bps / 100}%`}</Text>
              <Text testID="mbsx-receipt-fee" style={look.feeTotalValue}>
                {`${swap.fees_total ?? ''} ${swap.fees_coin ?? ''}`}
              </Text>
            </>
          ) : (
            <Text style={[look.feeTotalLabel, look.feeToggle]}>Chain Fees</Text>
          )}
        </TouchableOpacity>
        {open
          ? chains.map(([coin, amount, rate]) => (
              <View key={coin} style={[look.feeRow, look.feeLine]}>
                <Text style={look.feeLabel}>{`Chain Fee ${coin}`}</Text>
                <Text style={look.feeRate}>{`${rate} sat/kvB`}</Text>
                <Text style={look.feeValue}>{`~${amount ?? '?'}`}</Text>
              </View>
            ))
          : null}
      </View>
    </>
  );
};

const SwapDetail: React.FC<Props> = ({route, navigation}) => {
  const {swapId} = route.params;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const showRaw = useShowRawStates();
  const showDebug = useShowDebug();
  const utc = useShowUtcTimes();

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
    if (!rv) {
      return;
    }
    if (rv.error) {
      if (isGone(rv)) {
        navigation.navigate('SwapList');
      }
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

  const events = (
    <>
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
            const isTx = event.linked_type === 'SWAP_TX';
            const stepText = swapStateText(
              event.event_sub_type,
              swap.coin_from,
              swap.coin_to,
              swap.participating,
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
                  <Text style={swapCards.id}>
                    {String(event.event_sub_type)}
                  </Text>
                ) : null}
                <Text style={swapCards.historySub}>
                  {(event.time ?? event.created_at)
                    ? formatTimestamp(
                        String(event.time ?? event.created_at),
                        utc,
                        true,
                      )
                    : ''}
                </Text>
                {(event.event_msg ?? event.event_data) ? (
                  <Text style={swapCards.meta}>
                    {String(event.event_msg ?? event.event_data)}
                  </Text>
                ) : null}
                {event.linked_id ? (
                  <CopyChip
                    testID={`mbsx-copy-${event.id}`}
                    label={isTx ? 'Transaction' : 'Address'}
                    value={String(event.linked_id)}
                    display={
                      isTx
                        ? shortAddress(String(event.linked_id))
                        : shortId(String(event.linked_id))
                    }
                    style={look.idChip}
                    labelStyle={look.idLabel}
                    valueStyle={look.idValue}
                  />
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
    </>
  );

  const sides = swapSides(swap);
  if (isTerminalState(swap.state)) {
    const complete = isSwapComplete(swap.state);
    const sent = Number(sides.sendAmount);
    const received = Number(sides.receiveAmount);
    const rate =
      sent > 0 && received > 0
        ? `1 ${sides.sendCoin} ≈ ${coinString(received / sent)} ${sides.receiveCoin}`
        : '';
    const address = destinations?.[swap.request_id] ?? '';
    const refund = refundTxid(swap.events);
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}>
          <View style={swapCards.card}>
            <View style={swapCards.historyRow}>
              <CoinPair
                from={sides.sendCoin}
                to={sides.receiveCoin}
                size={40}
              />
              <View style={swapCards.historyMid}>
                <Text style={swapCards.historyTitle}>
                  {walletTitle(swap.state)}
                </Text>
                {complete ? null : (
                  <Text style={swapCards.historySub}>
                    {swapStateText(
                      swap.state,
                      swap.coin_from,
                      swap.coin_to,
                      swap.participating,
                    )}
                  </Text>
                )}
                <Text style={swapCards.historySub}>
                  {formatTimestamp(swap.created_at, utc)}
                </Text>
                {swap.initiating && showDebug ? (
                  <Text
                    testID="mbsx-swap-reversed"
                    style={swapCards.historySub}>
                    Reversed
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={swapCards.section}>Sent</Text>
          <View style={swapCards.card}>
            <CoinAmount amount={sides.sendAmount} coin={sides.sendCoin} />
          </View>
          <Flip />
          <Text style={swapCards.section}>Received</Text>
          <View style={swapCards.card}>
            <CoinAmount amount={sides.receiveAmount} coin={sides.receiveCoin} />
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
          {events}
          <TouchableOpacity
            testID="mbsx-receipt-done"
            style={styles.button}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
          {complete ? null : (
            <RemoveButton
              testID="mbsx-remove-swap"
              label="Delete Swap"
              confirm="Permanently delete this swap, its history and its keys? Anything it still holds can't be recovered afterwards."
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
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}>
        <View style={swapCards.card}>
          <View style={swapCards.historyRow}>
            <CoinPair from={sides.sendCoin} to={sides.receiveCoin} size={40} />
            <View style={swapCards.historyMid}>
              <Text style={swapCards.historyTitle}>
                {walletTitle(swap.state)}
              </Text>
              {swapStateText(
                swap.state,
                swap.coin_from,
                swap.coin_to,
                swap.participating,
              ).toLowerCase() ===
              walletTitle(swap.state).toLowerCase() ? null : (
                <Text style={swapCards.historySub}>
                  {swapStateText(
                    swap.state,
                    swap.coin_from,
                    swap.coin_to,
                    swap.participating,
                  )}
                </Text>
              )}
              {showRaw ? (
                <Text style={swapCards.historySub}>{swap.state}</Text>
              ) : null}
            </View>
          </View>
          <SwapProgress state={swap.state} expireAt={swap.expire_at} />
        </View>
        <Text style={swapCards.section}>Send</Text>
        <View style={swapCards.card}>
          <CoinAmount amount={sides.sendAmount} coin={sides.sendCoin} />
          {swap.kind ? (
            <Text style={swapCards.meta}>{kindLabel(swap.kind)}</Text>
          ) : null}
          {swap.initiating && showDebug ? (
            <Text testID="mbsx-swap-reversed" style={swapCards.meta}>
              Reversed
            </Text>
          ) : null}
          <Text style={swapCards.fromLine}>
            {`Created ${formatTimestamp(swap.created_at, utc)}`}
          </Text>
          {swap.state === 'AWAITING_LOCK_SIGS' ? (
            <TimeLine text={formatExpiry(swap.expire_at)} />
          ) : null}
          <TouchableOpacity
            testID="mbsx-swap-request"
            style={[styles.buttonSecondary, look.requestButton]}
            onPress={() =>
              navigation.navigate('RequestDetail', {requestId: swap.request_id})
            }>
            <Text style={styles.buttonSecondaryText}>View Request</Text>
          </TouchableOpacity>
        </View>

        <Flip />

        <Text style={swapCards.section}>Receive</Text>
        <View style={swapCards.card}>
          <CoinAmount amount={sides.receiveAmount} coin={sides.receiveCoin} />
          {Number(sides.sendAmount) > 0 && Number(sides.receiveAmount) > 0 ? (
            <Text style={swapCards.meta}>
              {`1 ${sides.sendCoin} ≈ ${coinString(
                Number(sides.receiveAmount) / Number(sides.sendAmount),
              )} ${sides.receiveCoin}`}
            </Text>
          ) : null}
        </View>
        <SwapFees swap={swap} />

        {events}

        <CopyChip
          testID="mbsx-swap-id"
          label="Copy Swap ID"
          value={swap.id}
          display={shortId(swap.id)}
          style={look.idChip}
          labelStyle={look.idLabel}
          valueStyle={look.idValue}
        />

        {/* Removes this swap alone; the request that funded it stays. */}
        {isTerminalState(swap.state) ? (
          <RemoveButton
            testID="mbsx-remove-swap"
            label="Delete Swap"
            confirm="Permanently delete this swap, its history and its keys? Anything it still holds can't be recovered afterwards."
            onConfirm={async () => {
              removeSwap(swapId);
              navigation.navigate('SwapList');
              return 'Removed';
            }}
          />
        ) : null}
        {showDebug ? (
          <RemoveButton
            testID="mbsx-abandon-swap"
            label="Abandon Swap"
            confirm="Abandon this swap? The app stops working on it: nothing more is sent for it, no refund and no swipe. Coins still locked in it can then only be recovered by hand."
            confirmLabel="Abandon"
            confirmAgain={
              swap.funds_at_risk
                ? "Funds are at risk: this swap's lock transaction was sent and has not been refunded or claimed. Once abandoned, the app will not recover those coins. Abandon anyway?"
                : undefined
            }
            onConfirm={async () => {
              abandonSwap(swapId);
              fetchSwap();
              return 'Abandoned';
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
  requestButton: {
    marginTop: 14,
    marginBottom: 0,
  },
  idChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  idLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
    marginRight: 8,
  },
  idValue: {
    fontFamily: 'Satoshi Variable',
    color: '#484859',
    fontSize: 13,
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
  feeToggle: {
    color: colors.primary,
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
