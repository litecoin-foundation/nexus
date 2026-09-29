import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
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
import {formatExpiry} from '../format';
import {getMbsxStyles} from '../theme';
import {SLIPPAGE, coinString} from '../useSwapAmounts';
import MbsxBackButton from '../components/MbsxBackButton';
import {depositStateText, useShowRawStates} from '../stateText';
import {
  cancelDeposit,
  getCoinPrices,
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

const expiry = (deposit: Deposit) =>
  formatExpiry(
    new Date(Number(deposit.expire_at) * 1000).toISOString().slice(0, -1),
  );

const suggestedFloor = (deposit: Deposit) => {
  const prices = getCoinPrices()?.prices;
  const from = Number(prices?.[deposit.coin]);
  const to = Number(prices?.[deposit.coin_to]);
  if (!from || !to) {
    return '';
  }
  return coinString(((Number(deposit.received) * from) / to) * (1 - SLIPPAGE));
};

const PayInDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const showRaw = useShowRawStates();
  const {depositId} = route.params;
  const [loaded, setLoaded] = useState<Deposit | null>(null);
  const [floor, setFloor] = useState('');
  const [error, setError] = useState('');
  // Stays mounted, so the last pay-in shown is still loaded when another opens
  const deposit = loaded?.deposit_id === depositId ? loaded : null;

  useEffect(() => {
    setFloor('');
    setError('');
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text testID="mbsx-payin-state" style={styles.rowPrimary}>
          {showRaw
            ? deposit.state
            : depositStateText(deposit.state, deposit.coin)}
        </Text>
        {PAYABLE.has(deposit.state) ? (
          <View style={look.block}>
            <Text style={styles.value}>Pay exactly</Text>
            <Text
              testID="mbsx-payin-amount"
              style={[styles.label, look.amountDue]}>
              {`${deposit.amount_due} ${deposit.coin}`}
            </Text>
            <View style={look.qr}>
              <QRCode value={deposit.address} size={SCREEN_HEIGHT * 0.25} />
            </View>
            <TouchableOpacity
              testID="mbsx-payin-address"
              onPress={() => Clipboard.setString(deposit.address)}>
              <Text style={[styles.valueLink, look.address]} selectable>
                {deposit.address}
              </Text>
            </TouchableOpacity>
            <Text style={styles.rowMessage}>
              {`Tap the address to copy it. Expires ${expiry(deposit)}.`}
            </Text>
          </View>
        ) : null}
        <View style={look.block}>
          <Text style={styles.label}>Received</Text>
          <Text testID="mbsx-payin-received" style={styles.value}>
            {`${deposit.received} ${deposit.coin}`}
          </Text>
          <Text style={styles.label}>You receive at least</Text>
          <Text style={styles.value}>
            {`${deposit.min_amount_to} ${deposit.coin_to}`}
          </Text>
          <Text style={styles.label}>Refunds go to</Text>
          <Text style={styles.value} selectable>
            {deposit.refund_address}
          </Text>
          {deposit.sweep_txid ? (
            <>
              <Text style={styles.label}>Refund transaction</Text>
              <Text testID="mbsx-payin-sweep" style={styles.value} selectable>
                {deposit.sweep_txid}
              </Text>
            </>
          ) : null}
        </View>
        {deposit.request_id ? (
          <TouchableOpacity
            testID="mbsx-payin-request"
            onPress={() =>
              navigation.navigate('RequestDetail', {
                requestId: deposit.request_id as string,
              })
            }>
            <Text style={styles.link}>View the swap request</Text>
          </TouchableOpacity>
        ) : null}
        {paused ? (
          <View style={look.block}>
            <Text style={styles.rowMessage}>
              {`Swap the ${deposit.received} ${deposit.coin} received for at least`}
            </Text>
            <TextInput
              testID="mbsx-payin-floor"
              style={styles.input}
              value={floor}
              onChangeText={setFloor}
              placeholder={`${deposit.coin_to} to receive`}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              testID="mbsx-payin-requote"
              style={[
                styles.button,
                floor === '' ? styles.buttonDisabled : null,
              ]}
              disabled={floor === ''}
              onPress={() => act(() => requoteDeposit(deposit, floor))}>
              <Text style={styles.buttonText}>Re-quote</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {error !== '' ? (
          <Text testID="mbsx-payin-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {CANCELLABLE.has(deposit.state) ? (
          <TouchableOpacity
            testID="mbsx-payin-cancel"
            style={styles.buttonSecondary}
            onPress={() => act(() => cancelDeposit(deposit.deposit_id))}>
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
  amountDue: {
    fontSize: 26,
    marginTop: 4,
  },
  address: {
    fontSize: 16,
  },
  block: {
    marginBottom: 16,
  },
  qr: {
    alignItems: 'center',
    marginVertical: 16,
  },
});

export default PayInDetail;
