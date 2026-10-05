import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {triggerLightFeedback} from '../../../utils/haptic';
import {depositTimeLeft} from '../format';
import {getMbsxStyles} from '../theme';
import {coinString, slippageFor} from '../useSwapAmounts';
import CoinPair from '../components/CoinPair';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import MbsxBackButton from '../components/MbsxBackButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import {depositStateText, useShowRawStates} from '../stateText';
import {
  cancelDeposit,
  getCoinPrices,
  getInfo,
  getRequestInfo,
  getSwapInfo,
  isUnderwayState,
  listDeposits,
  requoteDeposit,
} from '../adapter';
import type {Deposit, MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'PayInDetail'>;

const PAYABLE = new Set(['WAITING', 'SEEN', 'SHORT']);
const PAUSED = new Set(['SHORT', 'NO_QUOTE']);
const CANCELLABLE = new Set([
  'WAITING',
  'SEEN',
  'SHORT',
  'RECEIVED',
  'NO_QUOTE',
  'REQUESTED',
]);

const suggestedFloor = (deposit: Deposit) => {
  const prices = getCoinPrices()?.prices;
  const from = Number(prices?.[deposit.coin]);
  const to = Number(prices?.[deposit.coin_to]);
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const showRaw = useShowRawStates();
  const {depositId} = route.params;
  const [loaded, setLoaded] = useState<Deposit | null>(null);
  const [floor, setFloor] = useState('');
  const [error, setError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  // Stays mounted, so the last pay-in shown is still loaded when another opens
  const deposit = loaded?.deposit_id === depositId ? loaded : null;
  const openedSwapId = useRef<string | null>(null);

  useEffect(() => {
    setFloor('');
    setError('');
    setConfirmingCancel(false);
    openedSwapId.current = null;
  }, [depositId]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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

    const swapId = underwaySwapId(found.request_id);
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
      const timer = setInterval(fetchDeposit, 3000);
      return () => clearInterval(timer);
    }, [fetchDeposit]),
  );

  const paused = deposit !== null && PAUSED.has(deposit.state);
  useEffect(() => {
    if (deposit && paused && floor === '') {
      setFloor(suggestedFloor(deposit));
    }
  }, [deposit, paused, floor]);

  if (!deposit) {
    return <View style={styles.container} />;
  }

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
                {depositStateText(deposit.state, deposit.coin)}
              </Text>
              {showRaw ? (
                <Text style={swapCards.historySub}>{deposit.state}</Text>
              ) : null}
              <TimeLine
                text={depositTimeLeft(deposit.expire_at)}
                textStyle={swapCards.historySub}
              />
            </View>
          </View>
        </View>
        {deposit.payable ? (
          <>
            <View style={swapCards.card}>
              <View style={swapCards.historyRow}>
                {coinMark(deposit.coin)}
                <Text
                  testID="mbsx-payin-amount"
                  style={[swapCards.historyTitle, look.amount]}>
                  {`${deposit.remaining} ${deposit.coin}`}
                </Text>
                <TouchableOpacity
                  testID="mbsx-payin-copy-amount"
                  accessibilityLabel="Copy Amount"
                  style={look.iconBtn}
                  onPress={() => Clipboard.setString(deposit.remaining)}>
                  <Image
                    source={require('../../../assets/icons/copy-icon.png')}
                    style={look.toolIcon}
                  />
                </TouchableOpacity>
              </View>
              <Text style={swapCards.historySub}>Pay Exactly</Text>
              <View style={look.qr}>
                <QRCode value={deposit.address} size={SCREEN_HEIGHT * 0.22} />
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
                <TouchableOpacity
                  testID="mbsx-payin-copy"
                  accessibilityLabel="Copy"
                  style={look.iconBtn}
                  onPress={() => Clipboard.setString(deposit.address)}>
                  <Image
                    source={require('../../../assets/icons/copy-icon.png')}
                    style={look.toolIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : PAYABLE.has(deposit.state) ? (
          <View style={swapCards.card}>
            <Text testID="mbsx-payin-ended" style={swapCards.note}>
              This pay-in has ended, so don't pay into its address. Anything it
              received goes back to your refund address.
            </Text>
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
            style={styles.buttonSecondary}
            onPress={() =>
              navigation.navigate('RequestDetail', {
                requestId: deposit.request_id as string,
              })
            }>
            <Text style={styles.buttonSecondaryText}>View the Swap Request</Text>
          </TouchableOpacity>
        ) : null}
        {paused ? (
          <>
            <Text style={swapCards.section}>
              {deposit.state === 'NO_QUOTE' ? 'Lower the Minimum' : 'New Minimum'}
            </Text>
            <View style={swapCards.card}>
              <Text style={swapCards.note}>
                {deposit.state === 'NO_QUOTE'
                  ? `No offer met ${deposit.min_amount_to} ${deposit.coin_to}. Lower it to try again.`
                  : `Swap the ${deposit.received} ${deposit.coin} received for at least`}
              </Text>
              <TextInput
                testID="mbsx-payin-floor"
                style={styles.input}
                value={floor}
                onChangeText={setFloor}
                onFocus={() =>
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({animated: true}),
                    80,
                  )
                }
                placeholder={`${deposit.coin_to} to receive`}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                testID="mbsx-payin-requote"
                style={[
                  styles.button,
                  look.requote,
                  floor === '' ? styles.buttonDisabled : null,
                ]}
                disabled={floor === ''}
                onPress={() => act(() => requoteDeposit(deposit, floor))}>
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
        {CANCELLABLE.has(deposit.state) && !confirmingCancel ? (
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
      </ScrollView>
    </View>
  );
};

const look = StyleSheet.create({
  amount: {
    flex: 1,
  },
  qr: {
    alignItems: 'center',
    marginVertical: 16,
  },
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
  requote: {
    marginTop: 12,
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
