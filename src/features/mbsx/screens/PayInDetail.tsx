import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useKeyboardHeight} from '../useKeyboardHeight';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {triggerLightFeedback} from '../../../utils/haptic';
import {depositTimeLeft, typedAmount} from '../format';
import {independentReference, refreshRates, type Reference} from '../rates';
import {getMbsxStyles} from '../theme';
import {RATE_TOLERANCE, coinString, slippageFor} from '../useSwapAmounts';
import {
  NO_OFFERS_WARNING,
  offersAvailable,
  offersEstimateText,
  providersText,
  useOffersEstimate,
} from '../useOffersEstimate';
import CoinPair from '../components/CoinPair';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import MbsxBackButton from '../components/MbsxBackButton';
import CopyButton from '../components/CopyButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import RemoveButton from '../components/RemoveButton';
import {depositStateText, useShowDebug, useShowRawStates} from '../stateText';
import {
  cancelDeposit,
  getCoinPrices,
  getInfo,
  getRequestInfo,
  getSwapInfo,
  isUnderwayState,
  listDeposits,
  requestDepositAgain,
  rescueDeposit,
} from '../adapter';
import type {Deposit, MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'PayInDetail'>;

const PAYABLE = new Set(['WAITING', 'SEEN', 'SHORT']);
const URI_SCHEMES: Record<string, string> = {
  BTC: 'bitcoin',
  PART: 'particl',
  FIRO: 'firo',
};
const paymentUri = (coin: string, address: string, amount: string) =>
  URI_SCHEMES[coin]
    ? `${URI_SCHEMES[coin]}:${address}?amount=${amount}`
    : address;
const PAUSED = new Set(['SHORT', 'NO_OFFER']);
const CANCELLABLE = new Set([
  'WAITING',
  'SEEN',
  'SHORT',
  'RECEIVED',
  'NO_OFFER',
  'REQUESTED',
]);

type Prices = {from: number; to: number};

const payInPrices = (deposit: Deposit, reference: Reference | null): Prices => {
  if (reference) {
    return {from: reference.send, to: reference.receive};
  }
  const prices = getCoinPrices()?.prices;
  return {
    from: Number(prices?.[deposit.coin]),
    to: Number(prices?.[deposit.coin_to]),
  };
};

const suggestedFloor = (deposit: Deposit, {from, to}: Prices) => {
  if (!from || !to) {
    return '';
  }
  const slippage = slippageFor(getInfo()?.max_margin_bps);
  return coinString(((Number(deposit.received) * from) / to) * (1 - slippage));
};

const underwaySwapId = (requestId?: string): string | null => {
  if (!requestId) {
    return '';
  }
  const request = getRequestInfo(requestId);
  if (!request || request.error) {
    return null;
  }
  for (const swapId of request.swapids ?? []) {
    const swap = getSwapInfo(swapId);
    if (swap && !swap.error && isUnderwayState(swap.state)) {
      return swap.id;
    }
  }
  return '';
};

const PayInDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();
  const showRaw = useShowRawStates();
  const showDebug = useShowDebug();
  const {depositId} = route.params;
  const [loaded, setLoaded] = useState<Deposit | null>(null);
  const [floor, setFloor] = useState('');
  const rates = useAppSelector(state => state.mbsx.rates ?? {});
  const [error, setError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [offerWaiting, setOfferWaiting] = useState(false);
  const [swapUnderway, setSwapUnderway] = useState(false);
  // Stays mounted, so the last pay-in shown is still loaded when another opens
  const deposit = loaded?.deposit_id === depositId ? loaded : null;
  const openedSwapId = useRef<string | null>(null);
  const offerSeen = useRef<boolean | null>(null);

  useEffect(() => {
    setFloor('');
    setError('');
    setConfirmingCancel(false);
    setOfferWaiting(false);
    openedSwapId.current = null;
    offerSeen.current = null;
  }, [depositId]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <MbsxBackButton onPress={() => navigation.goBack()} />,
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation]);

  const fetchDeposit = useCallback(() => {
    const deposits = listDeposits();
    if (deposits === null) {
      return;
    }
    const found = deposits.find(entry => entry.deposit_id === depositId);
    if (!found) {
      navigation.navigate('RequestList');
      return;
    }
    setLoaded(found);
    const waiting =
      found.state === 'REQUESTED' &&
      found.request_id !== undefined &&
      getRequestInfo(found.request_id)?.state === 'OFFER_RECEIVED';
    setOfferWaiting(waiting);
    // Only an offer arriving while the page is open moves to it.
    if (waiting && offerSeen.current === false) {
      navigation.navigate('RequestDetail', {
        requestId: found.request_id as string,
      });
    }
    offerSeen.current = waiting;

    const swapId = underwaySwapId(found.request_id);
    setSwapUnderway(Boolean(swapId));
    if (swapId === null) {
      return;
    }
    // A swap already under way when the page opened is history.
    if (openedSwapId.current === null) {
      openedSwapId.current = swapId;
    } else if (swapId !== '' && swapId !== openedSwapId.current) {
      openedSwapId.current = swapId;
      navigation.navigate('SwapDetail', {swapId});
    }
  }, [depositId, navigation]);

  // The deposit watch moves a pay-in on its own polls, which send no message.
  useFocusEffect(
    useCallback(() => {
      fetchDeposit();
      refreshRates();
      const timer = setInterval(fetchDeposit, 3000);
      return () => {
        clearInterval(timer);
        offerSeen.current = null;
      };
    }, [fetchDeposit]),
  );

  const paused = deposit !== null && PAUSED.has(deposit.state);
  const focused = useIsFocused();
  const estimate = useOffersEstimate(
    focused && deposit?.state === 'WAITING'
      ? {
          coin_from: deposit.coin,
          amount_from: deposit.amount_due,
          coin_to: deposit.coin_to,
          min_amount_to: deposit.min_amount_to,
        }
      : null,
    true,
  );
  const providersLine = providersText(estimate);
  const reference = deposit
    ? independentReference(
        rates,
        deposit.coin,
        deposit.coin_to,
        Date.now() / 1000,
      )
    : null;
  const prices = deposit && paused ? payInPrices(deposit, reference) : null;
  const suggestion = deposit && prices ? suggestedFloor(deposit, prices) : '';
  const lastSuggestion = useRef('');
  useEffect(() => {
    if (
      suggestion !== '' &&
      (floor === '' || floor === lastSuggestion.current)
    ) {
      setFloor(suggestion);
    }
    lastSuggestion.current = suggestion;
  }, [suggestion, floor]);
  const rateLabel = reference ? reference.label : "Server's rate, not checked";
  const rateValue =
    deposit && prices && prices.from > 0 && prices.to > 0
      ? `1 ${deposit.coin} ≈ ${coinString(prices.from / prices.to)} ${
          deposit.coin_to
        }`
      : '';
  const floorShortfall =
    deposit && reference && Number(floor) > 0
      ? 1 -
        Number(floor) /
          ((Number(deposit.received) * reference.send) / reference.receive)
      : 0;

  if (!deposit) {
    return <View style={styles.container} />;
  }

  const expired = Number(deposit.expire_at) * 1000 <= Date.now();
  // The module sweeps an expired deposit back unless its swap has started
  const ended =
    (PAYABLE.has(deposit.state) && Number(deposit.remaining) > 0) ||
    (expired &&
      !swapUnderway &&
      Number(deposit.received) > 0 &&
      ['RECEIVED', 'NO_OFFER', 'REQUESTED'].includes(deposit.state));

  const act = (action: () => void) => {
    triggerLightFeedback();
    setError('');
    try {
      action();
      fetchDeposit();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const coinMark = (ticker: string) =>
    COIN_ICONS[ticker] ? (
      <Image source={COIN_ICONS[ticker]} style={swapCards.coinLogo} />
    ) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: bottom + keyboardHeight},
        ]}>
        <View style={swapCards.card}>
          <View style={swapCards.historyRow}>
            <CoinPair from={deposit.coin} to={deposit.coin_to} size={40} />
            <View style={swapCards.historyMid}>
              <Text testID="mbsx-payin-state" style={swapCards.historyTitle}>
                {depositStateText(
                  deposit.cancelled && CANCELLABLE.has(deposit.state)
                    ? 'CANCELLED'
                    : deposit.state,
                  deposit.coin,
                )}
              </Text>
              {offerWaiting ? (
                <Text testID="mbsx-payin-next" style={swapCards.historySub}>
                  View the swap request to continue
                </Text>
              ) : null}
              {showRaw ? (
                <Text style={swapCards.historySub}>{deposit.state}</Text>
              ) : null}
              <TimeLine
                text={depositTimeLeft(deposit.expire_at)}
                textStyle={swapCards.historySub}
              />
              {expired && deposit.state === 'SEEN' ? (
                <Text
                  testID="mbsx-payin-returning"
                  style={swapCards.historySub}>
                  Your payment goes back to your refund address once it
                  confirms.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {deposit.payable ? (
          <>
            <View style={swapCards.card}>
              <Text style={swapCards.historySub}>Pay Exactly</Text>
              <View style={look.addressRow}>
                <View style={look.addressBox}>
                  <Text testID="mbsx-payin-amount" style={look.address}>
                    {`${deposit.remaining} ${deposit.coin}`}
                  </Text>
                </View>
                <CopyButton
                  testID="mbsx-payin-copy-amount"
                  label="Copy Amount"
                  value={String(deposit.remaining)}
                  style={look.iconBtn}
                />
              </View>
              <View style={look.qr}>
                <QRCode
                  value={paymentUri(
                    deposit.coin,
                    deposit.address,
                    deposit.remaining,
                  )}
                  size={SCREEN_HEIGHT * 0.22}
                />
              </View>
              <View style={look.addressRow}>
                <View style={look.addressBox}>
                  <Text
                    testID="mbsx-payin-address"
                    style={look.address}
                    selectable>
                    {deposit.address}
                  </Text>
                </View>
                <CopyButton
                  testID="mbsx-payin-copy"
                  label="Copy Address"
                  value={deposit.address}
                  style={look.iconBtn}
                />
              </View>
            </View>
          </>
        ) : ended ? (
          <View style={swapCards.card}>
            <Text testID="mbsx-payin-ended" style={swapCards.note}>
              This pay-in has ended, so don't pay into its address. Anything it
              received goes back to your refund address.
            </Text>
          </View>
        ) : null}
        {deposit.state === 'WAITING' ? (
          <View style={swapCards.card}>
            <Text testID="mbsx-payin-estimate" style={swapCards.note}>
              {`Offers Now: ${offersEstimateText(estimate)}`}
            </Text>
            {providersLine ? (
              <Text style={swapCards.historySub}>{providersLine}</Text>
            ) : null}
            {estimate?.state === 'answered' && !offersAvailable(estimate) ? (
              <Text testID="mbsx-payin-no-offers" style={styles.error}>
                {NO_OFFERS_WARNING}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text style={swapCards.section}>Received</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            {coinMark(deposit.coin)}
            <Text testID="mbsx-payin-received" style={swapCards.historyTitle}>
              {`${deposit.received} ${deposit.coin}`}
            </Text>
          </View>
          {Number(deposit.unconfirmed) > 0 ? (
            <Text testID="mbsx-payin-unconfirmed" style={swapCards.historySub}>
              {`${deposit.unconfirmed} ${deposit.coin} unconfirmed`}
            </Text>
          ) : null}
        </View>
        <Text style={swapCards.section}>You Receive at Least</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            {coinMark(deposit.coin_to)}
            <Text style={swapCards.historyTitle}>
              {`${deposit.min_amount_to} ${deposit.coin_to}`}
            </Text>
          </View>
        </View>
        <Text style={swapCards.section}>Refunds Go To</Text>
        <View style={swapCards.card}>
          <Text selectable style={swapCards.meta}>
            {deposit.refund_address}
          </Text>
        </View>
        {deposit.sweep_txid ? (
          <>
            <Text style={swapCards.section}>Refund Transaction</Text>
            <TouchableOpacity
              testID="mbsx-payin-sweep"
              style={swapCards.card}
              onPress={() => Clipboard.setString(deposit.sweep_txid as string)}>
              <Text selectable style={swapCards.meta}>
                {deposit.sweep_txid}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
        {deposit.request_id ? (
          <TouchableOpacity
            testID="mbsx-payin-request"
            style={offerWaiting ? styles.button : styles.buttonSecondary}
            onPress={() =>
              navigation.navigate('RequestDetail', {
                requestId: deposit.request_id as string,
              })
            }>
            <Text
              style={
                offerWaiting ? styles.buttonText : styles.buttonSecondaryText
              }>
              View Request
            </Text>
          </TouchableOpacity>
        ) : null}
        {paused ? (
          <>
            <Text style={swapCards.section}>
              {deposit.state === 'NO_OFFER'
                ? 'Lower the Minimum'
                : 'New Minimum'}
            </Text>
            <View style={swapCards.card}>
              <Text style={[swapCards.note, look.floorNote]}>
                {deposit.state === 'NO_OFFER'
                  ? `No offer met ${deposit.min_amount_to} ${deposit.coin_to}. Lower it to try again.`
                  : `Swap the ${deposit.received} ${deposit.coin} received for at least`}
              </Text>
              <TextInput
                testID="mbsx-payin-floor"
                style={styles.input}
                value={floor}
                onChangeText={value => {
                  const amount = typedAmount(value);
                  if (amount !== null) {
                    setFloor(amount);
                  }
                }}
                onFocus={() =>
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({animated: true}),
                    80,
                  )
                }
                placeholder={`${deposit.coin_to} to Receive`}
                keyboardType="decimal-pad"
              />
              {rateValue ? (
                <View style={look.quoteRow}>
                  <Text style={look.quoteLabel}>{rateLabel}</Text>
                  <Text testID="mbsx-payin-rate" style={look.quoteValue}>
                    {rateValue}
                  </Text>
                </View>
              ) : null}
              {reference && floorShortfall > RATE_TOLERANCE ? (
                <Text testID="mbsx-payin-floor-warning" style={styles.error}>
                  {`This minimum is ${Math.round(
                    floorShortfall * 100,
                  )}% below the ${reference.label}.`}
                </Text>
              ) : null}
              <TouchableOpacity
                testID="mbsx-payin-requote"
                style={[
                  styles.button,
                  look.requote,
                  floor === '' ? styles.buttonDisabled : null,
                ]}
                disabled={floor === ''}
                onPress={() => act(() => requestDepositAgain(deposit, floor))}>
                <Text style={styles.buttonText}>Re-quote</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {error !== '' ? (
          <Text testID="mbsx-payin-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {confirmingCancel ? (
          <View testID="mbsx-payin-cancel-confirm" style={swapCards.card}>
            <Text style={swapCards.historyTitle}>Return the Payment?</Text>
            <Text style={swapCards.note}>
              {`${deposit.received} ${deposit.coin} goes back to your refund address.`}
            </Text>
            <View style={look.confirmActions}>
              <TouchableOpacity
                testID="mbsx-payin-cancel-keep"
                style={[styles.buttonSecondary, look.confirmAction]}
                onPress={() => setConfirmingCancel(false)}>
                <Text style={styles.buttonSecondaryText}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="mbsx-payin-cancel-confirm-button"
                style={[styles.button, look.confirmAction]}
                onPress={() => {
                  setConfirmingCancel(false);
                  act(() => cancelDeposit(deposit.deposit_id));
                }}>
                <Text style={styles.buttonText}>Return Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {CANCELLABLE.has(deposit.state) && !expired && !confirmingCancel ? (
          <TouchableOpacity
            testID="mbsx-payin-cancel"
            style={styles.buttonSecondary}
            onPress={() => {
              if (Number(deposit.received) > 0) {
                setConfirmingCancel(true);
                return;
              }
              act(() => cancelDeposit(deposit.deposit_id));
            }}>
            <Text style={styles.buttonSecondaryText}>
              {deposit.state === 'WAITING'
                ? 'Cancel'
                : 'Cancel and return the payment'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {showDebug &&
        !offerWaiting &&
        !swapUnderway &&
        !['SWEEPING', 'SWEPT', 'SPENT'].includes(deposit.state) ? (
          <RemoveButton
            testID="mbsx-payin-rescue"
            label="Force Refund"
            confirm="Sweep every coin the server lists at this address to the refund address, without proving it confirmed?"
            confirmLabel="Refund"
            confirmAgain={
              deposit.state === 'REQUESTED'
                ? 'This also closes its swap request, so none of its offers can be accepted. Refund anyway?'
                : Number(deposit.received) > 0
                  ? 'It has received coins, and they go back to the refund address instead of being swapped. Refund anyway?'
                  : undefined
            }
            onConfirm={async () => {
              const swept = rescueDeposit(deposit.deposit_id);
              fetchDeposit();
              return `Swept ${swept} coin${swept === 1 ? '' : 's'}`;
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
};

const look = StyleSheet.create({
  qr: {
    alignItems: 'center',
    marginVertical: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  requote: {
    marginTop: 12,
  },
  floorNote: {
    lineHeight: 22,
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  quoteLabel: {
    flexShrink: 1,
    marginRight: 12,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 14,
  },
  quoteValue: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
    textAlign: 'right',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  confirmAction: {
    flex: 1,
    marginVertical: 0,
  },
});

export default PayInDetail;
