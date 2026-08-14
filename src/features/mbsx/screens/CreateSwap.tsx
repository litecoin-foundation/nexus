import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {AddressType, newAddress} from 'react-native-nitro-lndltc';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {
  isHwWalletSelectedSelector,
  selectedAccountNamesSelector,
} from '../../../reducers/wallets';
import {rememberAddress, setLastCoin} from '../addressesSlice';
import CoinSelector from '../components/CoinSelector';
import {
  getCoinPrices,
  isRunning,
  parseAmount,
  recordLeases,
  releasePrevouts,
  requestSwap,
  selectAndLeasePrevouts,
  serialisePrevout,
} from '../adapter';
import {getMbsxStyles} from '../theme';
import type {MbsxCoinPrices, MbsxDrawerParamList} from '../types';
import {AmountSide, SLIPPAGE, useSwapAmounts} from '../useSwapAmounts';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CreateSwap'>;

// Nexus funds every swap from its own wallet, so the sending side is fixed.
const COIN_FROM = 'LTC';
const DUST_LIMIT = 294n;
const MAX_SUGGESTED_ADDRESSES = 3;

const CreateSwap: React.FC<Props> = ({navigation, route}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const lastCoin = useAppSelector(state => state.mbsxAddresses.lastCoin);
  const [coinTo, setCoinTo] = useState(lastCoin);
  const [addressTo, setAddressTo] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prices, setPrices] = useState<MbsxCoinPrices | null>(null);
  const [addressFocused, setAddressFocused] = useState(false);

  // `running` goes true when initialise() returns, before the handshake that
  // carries the prices.
  useFocusEffect(
    useCallback(() => {
      setPrices(getCoinPrices());
      const timer = setInterval(() => setPrices(getCoinPrices()), 2000);
      return () => clearInterval(timer);
    }, []),
  );

  const {amounts, setAmount, canConvert, fixedRate, setFixedRate} =
    useSwapAmounts(prices?.prices?.[COIN_FROM], prices?.prices?.[coinTo]);
  const amountFrom = amounts.fromCoin;
  const amountTo = amounts.toCoin;

  const dispatch = useAppDispatch();
  const savedAddresses = useAppSelector(state =>
    coinTo ? (state.mbsxAddresses.byCoin[coinTo] ?? []) : [],
  );

  // Scan pops back onto this screen with the result in params.
  const scanned = route.params?.scanData;
  useEffect(() => {
    if (scanned) {
      setAddressTo(scanned);
    }
  }, [scanned]);

  // Rehydration can land after the first render, so the initial state above is
  // not enough on its own.
  useEffect(() => {
    if (!coinTo && lastCoin) {
      setCoinTo(lastCoin);
    }
  }, [coinTo, lastCoin]);

  const selectCoin = (coin: string) => {
    setCoinTo(coin);
    dispatch(setLastCoin(coin));
  };

  const isHwWallet = useAppSelector(isHwWalletSelectedSelector);
  const {ltcAccount} = useAppSelector(selectedAccountNamesSelector);

  const renderAmountRow = ({
    side,
    label,
    coin,
    priced,
  }: {
    side: AmountSide;
    label: string;
    coin: string;
    priced: boolean;
  }) => (
    <View key={side}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.amountBox}>
        <View style={styles.amountLine}>
          <TextInput
            testID={`mbsx-amount-${side}`}
            style={styles.amountInput}
            placeholder="0"
            value={side === 'from' ? amounts.fromCoin : amounts.toCoin}
            onChangeText={value => setAmount(side, 'coin', value)}
            keyboardType="numeric"
          />
          <Text style={styles.amountUnit}>{coin || '—'}</Text>
        </View>
        <View style={[styles.amountLine, styles.amountLineLower]}>
          <TextInput
            testID={`mbsx-amount-${side}-usd`}
            style={[styles.amountInput, priced ? null : styles.amountDisabled]}
            placeholder="0.00"
            value={side === 'from' ? amounts.fromUsd : amounts.toUsd}
            onChangeText={value => setAmount(side, 'usd', value)}
            editable={priced}
            keyboardType="numeric"
          />
          <Text
            style={[styles.amountUnit, priced ? null : styles.amountDisabled]}>
            {prices?.currency ?? 'USD'}
          </Text>
        </View>
      </View>
    </View>
  );

  const submit = async () => {
    setRequestId('');
    setError('');
    setBusy(true);
    try {
      if (!isRunning()) {
        throw new Error('Swaps are not running');
      }
      if (!coinTo) {
        throw new Error('Select a coin to receive');
      }
      if (!addressTo) {
        throw new Error('Missing receive address');
      }
      // Amounts are entered in whole coins; the module holds the only conversion.
      let amountFromSats: bigint;
      try {
        amountFromSats = parseAmount(COIN_FROM, amountFrom);
      } catch {
        throw new Error('Invalid amount to send');
      }
      if (amountFromSats < DUST_LIMIT) {
        throw new Error('Amount to send is too small to spend');
      }
      // Parsed only to reject it here: the module is sent the string. Leasing
      // coins and then failing on the receive amount would strand them.
      try {
        parseAmount(coinTo, amountTo);
      } catch {
        throw new Error('Invalid amount to receive');
      }
      // Change and, if the swap fails, the whole refund come back here rather
      // than to a module key, so it is one of ours.
      const change = await newAddress({
        type: AddressType.UNUSED_WITNESS_PUBKEY_HASH,
        account: ltcAccount,
      });
      if (!change?.address) {
        throw new Error('Could not get a change address');
      }

      const prevouts = await selectAndLeasePrevouts(
        amountFromSats,
        change.address,
        isHwWallet,
        ltcAccount,
      );

      let rv;
      try {
        rv = await requestSwap({
          coin_from: COIN_FROM,
          coin_to: coinTo,
          amount_from: amountFrom,
          amount_to: amountTo,
          address_to: addressTo,
          change_address: change.address,
          outputs: prevouts.map(serialisePrevout),
        });
      } catch (e) {
        // The coins are locked and nothing is tracking them yet.
        await releasePrevouts(prevouts);
        throw e;
      }
      if (rv.error) {
        await releasePrevouts(prevouts);
        throw new Error(rv.error);
      }

      recordLeases(rv.request_id, prevouts);
      dispatch(rememberAddress({coin: coinTo, address: addressTo}));
      setRequestId(rv.request_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Without this a tap while the keyboard is up never reaches the button
          under it. */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <CoinSelector label="Receive" value={coinTo} onChange={selectCoin} />
        <Text style={styles.inputLabel}>Receive address</Text>
        <TextInput
          testID="mbsx-address-to"
          style={styles.input}
          placeholder="Address"
          value={addressTo}
          onChangeText={setAddressTo}
          onFocus={() => setAddressFocused(true)}
          onBlur={() => setAddressFocused(false)}
          autoCapitalize="none"
        />
        {addressFocused && !addressTo && savedAddresses.length > 0 ? (
          <View testID="mbsx-saved-addresses" style={styles.dropdown}>
            {savedAddresses.slice(0, MAX_SUGGESTED_ADDRESSES).map(entry => (
              <TouchableOpacity
                key={entry.address}
                testID={`mbsx-saved-${entry.address}`}
                onPress={() => setAddressTo(entry.address)}
                style={styles.stackedRow}>
                {entry.label ? (
                  <Text style={styles.rowPrimary}>{entry.label}</Text>
                ) : null}
                <Text style={styles.rowMessage} numberOfLines={1}>
                  {entry.address}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {/* The address is on coin_to, so nothing here can judge it - validating
            it against Litecoin would reject every correct one. Scanning is the
            defence against a typo instead. */}
        <TouchableOpacity
          testID="mbsx-scan"
          onPress={() =>
            navigation.getParent()?.navigate('Scan', {
              returnRoute: 'MbsxStack',
              returnScreen: 'CreateSwap',
            })
          }>
          <Text style={styles.link}>Scan a QR code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="mbsx-addresses"
          onPress={() =>
            coinTo
              ? navigation.navigate('CoinAddresses', {coin: coinTo})
              : navigation.navigate('AddressList')
          }>
          <Text style={styles.link}>
            {savedAddresses.length > MAX_SUGGESTED_ADDRESSES
              ? 'All saved addresses'
              : 'Saved addresses'}
          </Text>
        </TouchableOpacity>
        {renderAmountRow({
          side: 'to',
          label: 'Amount to receive',
          coin: coinTo,
          priced: Boolean(coinTo && prices?.prices?.[coinTo]),
        })}
        {renderAmountRow({
          side: 'from',
          label: 'Amount to send',
          coin: COIN_FROM,
          priced: Boolean(prices?.prices?.[COIN_FROM]),
        })}
        {canConvert ? (
          <>
            <TouchableOpacity
              testID="mbsx-fix-rate"
              accessibilityState={{checked: fixedRate}}
              onPress={() => setFixedRate(!fixedRate)}>
              <Text style={styles.link}>
                {fixedRate ? 'Fix rate: on' : 'Fix rate: off'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.empty}>
              {fixedRate
                ? `Reference rate from the swap server. A derived amount allows ${
                    SLIPPAGE * 100
                  }% slippage.`
                : 'Both amounts are as entered, at whatever rate they imply.'}
            </Text>
          </>
        ) : null}
        {/* Coins are leased before the request is sent, so a second submit
            would lock a second set of them. */}
        <TouchableOpacity
          testID="mbsx-submit"
          style={styles.button}
          onPress={submit}
          disabled={busy}>
          <Text style={styles.buttonText}>
            {busy ? 'Requesting…' : 'Request swap'}
          </Text>
        </TouchableOpacity>
        {error !== '' ? (
          <Text testID="mbsx-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {requestId !== '' ? (
          <TouchableOpacity
            testID="mbsx-request"
            onPress={() => navigation.navigate('RequestDetail', {requestId})}>
            <Text style={styles.link}>{`Request sent: ${requestId}`}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default CreateSwap;
