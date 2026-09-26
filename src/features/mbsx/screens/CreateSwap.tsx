import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {AddressType, newAddress} from 'react-native-nitro-lndltc';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {
  isHwWalletSelectedSelector,
  selectedAccountNamesSelector,
} from '../../../reducers/wallets';
import {rememberAddress, setLastCoin} from '../addressesSlice';
import {COINS} from '../components/CoinSelector';
import {
  getCoinPrices,
  getInfo,
  getSwapFundingOutputs,
  isRunning,
  parseAmount,
  recordLeases,
  releasePrevouts,
  requestSwap,
  selectAndLeasePrevouts,
  serialisePrevout,
  swapBalances,
  validateAddress,
} from '../adapter';
import {getMbsxStyles} from '../theme';
import type {MbsxCoinPrices, MbsxDrawerParamList, MbsxInfo} from '../types';
import {
  RATE_TOLERANCE,
  SLIPPAGE,
  coinString,
  useSwapAmounts,
} from '../useSwapAmounts';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CreateSwap'>;

// Nexus funds every swap from its own wallet, so the sending side is fixed.
const COIN_FROM = 'LTC';

const COIN_ICONS: Record<string, number> = {
  LTC: require('../../../assets/images/coins/ltc.png'),
  BTC: require('../../../assets/images/coins/btc.png'),
  PART: require('../../../assets/images/coins/part.png'),
  XMR: require('../../../assets/images/coins/xmr.png'),
  FIRO: require('../../../assets/images/coins/firo.png'),
};
const DUST_LIMIT = 294n;
const numericAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned;
  }
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
};
const fiatFieldWidth = (value: string) =>
  Math.max(18, (value || '0').length * 10);

const shortAddress = (address: string) =>
  address.length > 18
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;

const CreateSwap: React.FC<Props> = ({navigation, route}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const lastCoin = useAppSelector(state => state.mbsxAddresses.lastCoin);
  const [coinTo, setCoinTo] = useState(lastCoin);
  const [addressTo, setAddressTo] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prices, setPrices] = useState<MbsxCoinPrices | null>(null);
  const [info, setInfo] = useState<MbsxInfo | null>(null);
  const [balances, setBalances] = useState<{
    spendable: bigint;
    unconfirmed: bigint;
  } | null>(null);
  const [addressFocused, setAddressFocused] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [receiversOpen, setReceiversOpen] = useState(false);

  // `running` goes true when initialise() returns, before the handshake that
  // carries the prices.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      const read = () => {
        setPrices(getCoinPrices());
        setInfo(getInfo());
      };
      read();
      swapBalances()
        .then(rv => live && setBalances(rv))
        .catch(() => live && setBalances(null));
      const timer = setInterval(read, 2000);
      return () => {
        live = false;
        clearInterval(timer);
      };
    }, []),
  );

  // getInfo reports the coins the module loaded, so one disabled in settings is
  // absent here.
  const loadedCoins = info ? Object.keys(info.coins) : null;
  const offeredCoins = loadedCoins
    ? COINS.filter(coin => loadedCoins.includes(coin))
    : COINS;

  // The handshake says which coins the server bridges; no request before it
  const unbridgedCoin = [COIN_FROM, coinTo].find(
    coin => coin !== '' && info?.coins[coin]?.bridge_supported !== true,
  );
  const bridgeNote = !info?.connected
    ? 'Waiting for the swap server…'
    : unbridgedCoin
      ? `The swap server has no bridge for ${unbridgedCoin}`
      : '';

  const {
    amounts,
    setAmount,
    canConvert,
    fixedRate,
    setFixedRate,
    valueDeviation,
    reset: resetAmounts,
  } = useSwapAmounts(prices?.prices?.[COIN_FROM], prices?.prices?.[coinTo]);
  const [rateAcknowledged, setRateAcknowledged] = useState(false);
  const offReference =
    valueDeviation !== null && Math.abs(valueDeviation) > RATE_TOLERANCE;
  const coinChosen = coinTo !== '';
  const addressInvalid =
    addressTo !== '' && coinChosen && !validateAddress(coinTo, addressTo);
  const amountFrom = amounts.fromCoin;
  const amountTo = amounts.toCoin;

  // The cap is enforced at offer receipt; refusing here saves leasing coins
  const [feeNote, setFeeNote] = useState('');
  useEffect(() => {
    setFeeNote('');
    if (amountFrom === '') {
      return;
    }
    const funding = getSwapFundingOutputs(COIN_FROM, amountFrom);
    if (
      funding.error ||
      funding.total_fee_bps === undefined ||
      funding.max_fee_bps === undefined ||
      funding.total_fee_bps <= funding.max_fee_bps
    ) {
      return;
    }
    setFeeNote(
      `The swap server charges ${Number(funding.total_fee_bps) / 100}%, above your limit of ${Number(funding.max_fee_bps) / 100}%`,
    );
  }, [amountFrom]);

  const blockNote = bridgeNote || feeNote;

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

  useEffect(() => {
    setRateAcknowledged(false);
  }, [amounts.fromCoin, amounts.toCoin]);

  const selectCoin = (coin: string) => {
    setCoinTo(coin);
    setCoinOpen(false);
    dispatch(setLastCoin(coin));
  };

  const isHwWallet = useAppSelector(isHwWalletSelectedSelector);
  const {ltcAccount} = useAppSelector(selectedAccountNamesSelector);

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
      if (!offeredCoins.includes(coinTo)) {
        throw new Error(`${coinTo} is disabled`);
      }
      if (!addressTo) {
        throw new Error('Missing receive address');
      }
      if (!validateAddress(coinTo, addressTo)) {
        throw new Error(`Not a ${coinTo} address`);
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

      const funding = getSwapFundingOutputs(COIN_FROM, amountFrom);
      if (funding.error || !funding.outputs) {
        throw new Error(`Could not size the swap: ${funding.error}`);
      }
      const prevouts = await selectAndLeasePrevouts(
        funding.outputs,
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
      // coinTo is deliberately kept: it is lastCoin.
      resetAmounts();
      setAddressTo('');
      setRateAcknowledged(false);
      navigation.navigate('RequestDetail', {requestId: rv.request_id});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const spendableLabel =
    coinString(Number(balances?.spendable ?? 0n) / 1e8) || '0';
  const selectedSaved = savedAddresses.find(
    entry => entry.address === addressTo,
  );
  const currency = prices?.currency ?? 'USD';

  return (
    <View style={styles.container}>
      <ScrollView
        style={look.scroller}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Text style={look.section}>Send</Text>
        <View style={look.card}>
          <View style={look.amountRow}>
            <TextInput
              testID="mbsx-amount-from"
              style={look.amount}
              placeholder="0"
              placeholderTextColor="#C5C5CE"
              value={amounts.fromCoin}
              onChangeText={value => setAmount('from', 'coin', numericAmount(value))}
              keyboardType="decimal-pad"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <View style={look.coinPill}>
              <Image source={COIN_ICONS[COIN_FROM]} style={look.coinLogo} />
              <Text style={look.coinPillText}>{COIN_FROM}</Text>
            </View>
          </View>
          <View style={look.metaRow}>
            <View style={look.fiatLine}>
              <TextInput
                testID="mbsx-usd-from"
                style={[look.fiatInput, {width: fiatFieldWidth(amounts.fromUsd)}]}
                placeholder="0"
                placeholderTextColor="#747E87"
                value={amounts.fromUsd}
                onChangeText={value =>
                  setAmount('from', 'usd', numericAmount(value))
                }
                keyboardType="decimal-pad"
              />
              <Text style={look.fiat}>{currency}</Text>
            </View>
            <TouchableOpacity
              disabled={!coinChosen || !balances}
              onPress={() => setAmount('from', 'coin', spendableLabel)}>
              <Text style={look.max}>{`Max.  ${spendableLabel} ${COIN_FROM}`}</Text>
            </TouchableOpacity>
          </View>
          {balances && balances.unconfirmed > 0n ? (
            <Text style={look.unconfirmed}>
              {`${coinString(Number(balances.unconfirmed) / 1e8)} ${COIN_FROM} unconfirmed`}
            </Text>
          ) : null}
          <Text style={look.fromLine}>
            {`From  ${ltcAccount || 'LTC wallet'}`}
          </Text>
        </View>

        <View style={look.flipWrap}>
          <View style={look.flipLine} />
          <View style={look.flip}>
            <Image
              source={require('../../../assets/icons/switch-arrow.png')}
              style={look.flipIcon}
            />
          </View>
        </View>

        <Text style={look.section}>Receive</Text>
        <View style={look.card}>
          <View style={look.amountRow}>
            <TextInput
              testID="mbsx-amount-to"
              style={look.amount}
              placeholder="0"
              placeholderTextColor="#C5C5CE"
              value={amounts.toCoin}
              onChangeText={value => setAmount('to', 'coin', numericAmount(value))}
              keyboardType="decimal-pad"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              testID="mbsx-coin-pill"
              style={look.coinPill}
              onPress={() => setCoinOpen(open => !open)}>
              {coinTo && COIN_ICONS[coinTo] ? (
                <Image source={COIN_ICONS[coinTo]} style={look.coinLogo} />
              ) : null}
              <Text style={look.coinPillText}>{coinTo || 'Coin'}</Text>
              <Image
                source={require('../../../assets/images/forward.png')}
                style={look.chevron}
              />
            </TouchableOpacity>
          </View>
          {coinOpen ? (
            <View style={look.coinMenu}>
              {offeredCoins.map(coin => (
                <TouchableOpacity
                  key={coin}
                  testID={`mbsx-coin-${coin}`}
                  accessibilityState={{selected: coinTo === coin}}
                  style={look.coinOption}
                  onPress={() => selectCoin(coin)}>
                  {COIN_ICONS[coin] ? (
                    <Image source={COIN_ICONS[coin]} style={look.coinLogo} />
                  ) : null}
                  <Text style={look.coinPillText}>{coin}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={[look.fiatLine, look.fiatLineBelow]}>
            <TextInput
              testID="mbsx-usd-to"
              style={[look.fiatInput, {width: fiatFieldWidth(amounts.toUsd)}]}
              placeholder="0"
              placeholderTextColor="#747E87"
              value={amounts.toUsd}
              onChangeText={value =>
                setAmount('to', 'usd', numericAmount(value))
              }
              keyboardType="decimal-pad"
            />
            <Text style={look.fiat}>{currency}</Text>
          </View>
          {coinChosen ? null : (
            <Text testID="mbsx-select-coin-note" style={styles.rowMessage}>
              Select the coin to receive first
            </Text>
          )}
          <View style={look.receiverRow}>
            <TextInput
              key={coinChosen ? 'address-on' : 'address-off'}
              testID="mbsx-address-to"
              style={[look.receiver, coinChosen ? null : styles.inputDisabled]}
              placeholder="Receive address"
              placeholderTextColor="#9AA0AE"
              value={addressTo}
              onChangeText={setAddressTo}
              onFocus={() => setAddressFocused(true)}
              onBlur={() => setAddressFocused(false)}
              editable={coinChosen}
              autoCapitalize="none"
            />
            <TouchableOpacity
              testID="mbsx-paste"
              disabled={!coinChosen}
              style={[look.iconBtn, coinChosen ? null : look.iconBtnOff]}
              onPress={async () => {
                const text = await Clipboard.getString();
                if (text.trim()) {
                  setAddressTo(text.trim());
                }
              }}>
              <Image
                source={require('../../../assets/icons/copy-icon.png')}
                style={look.toolIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="mbsx-scan"
              disabled={!coinChosen}
              style={[look.iconBtn, coinChosen ? null : look.iconBtnOff]}
              onPress={() =>
                navigation.getParent()?.navigate('Scan', {
                  returnRoute: 'MbsxStack',
                  returnScreen: 'CreateSwap',
                })
              }>
              <Image
                source={require('../../../assets/images/qrcode-btn.png')}
                style={look.toolIcon}
              />
            </TouchableOpacity>
          </View>
          {addressInvalid ? (
            <Text testID="mbsx-address-error" style={styles.error}>
              Not a {coinTo} address
            </Text>
          ) : null}
          <TouchableOpacity
            testID="mbsx-addresses"
            disabled={!coinChosen}
            style={[look.receiverPick, coinChosen ? null : look.iconBtnOff]}
            onPress={() => setReceiversOpen(open => !open)}>
            <Text style={look.receiverPickText} numberOfLines={1}>
              {selectedSaved?.label ||
                (addressTo ? shortAddress(addressTo) : 'Select receiver')}
            </Text>
            <Image
              source={require('../../../assets/images/forward.png')}
              style={look.chevron}
            />
          </TouchableOpacity>
          {receiversOpen ? (
            <View testID="mbsx-saved-addresses" style={look.coinMenu}>
              {savedAddresses.length === 0 ? (
                <Text style={look.emptyReceivers}>No saved addresses</Text>
              ) : (
                savedAddresses.map(entry => (
                  <TouchableOpacity
                    key={entry.address}
                    testID={`mbsx-saved-${entry.address}`}
                    style={look.coinOption}
                    onPress={() => {
                      setAddressTo(entry.address);
                      setReceiversOpen(false);
                    }}>
                    {entry.label ? (
                      <Text style={look.coinPillText}>{entry.label}</Text>
                    ) : null}
                    <Text style={look.receiverAddr} numberOfLines={1}>
                      {shortAddress(entry.address)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                testID="mbsx-manage-addresses"
                style={look.manage}
                onPress={() =>
                  navigation.navigate('CoinAddresses', {coin: coinTo})
                }>
                <Text style={look.saved}>Manage addresses</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={look.advancedToggle}
          onPress={() => setAdvanced(open => !open)}>
          <Text style={look.advancedLabel}>Advanced</Text>
          <Image
            source={require('../../../assets/images/forward.png')}
            style={[look.chevron, advanced ? look.chevronOpen : null]}
          />
        </TouchableOpacity>
        {advanced ? (
          <View style={look.card}>
            <View style={look.settingRow}>
              <Text style={look.settingLabel}>Fix rate</Text>
              <Switch
                testID="mbsx-fix-rate"
                value={fixedRate}
                onValueChange={setFixedRate}
                trackColor={{false: '#E5E5EA', true: '#2C72FF'}}
                thumbColor="#fff"
              />
            </View>
            {fixedRate ? (
              <View style={[look.settingRow, look.settingRowLine]}>
                <Text style={look.settingLabel}>Slippage</Text>
                <Text style={look.settingValue}>{`${SLIPPAGE * 100}%`}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {offReference ? (
          <TouchableOpacity
            testID="mbsx-rate-warning"
            onPress={() => setRateAcknowledged(true)}>
            <Text style={styles.error}>
              {`You would receive ${Math.abs(
                Math.round((valueDeviation as number) * 100),
              )}% ${
                (valueDeviation as number) < 0 ? 'less' : 'more'
              } than the reference rate.${
                rateAcknowledged ? '' : ' Tap this warning to continue anyway.'
              }`}
            </Text>
          </TouchableOpacity>
        ) : null}
        {blockNote !== '' ? (
          <Text testID="mbsx-bridge-note" style={styles.rowMessage}>
            {blockNote}
          </Text>
        ) : null}
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
      <View style={[look.footer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <TouchableOpacity
          testID="mbsx-submit"
          style={[
            styles.button,
            look.submit,
            busy ||
            !coinChosen ||
            addressInvalid ||
            blockNote !== '' ||
            (offReference && !rateAcknowledged)
              ? styles.buttonDisabled
              : null,
          ]}
          onPress={submit}
          disabled={
            busy ||
            !coinChosen ||
            addressInvalid ||
            blockNote !== '' ||
            (offReference && !rateAcknowledged)
          }>
          <Text style={styles.buttonText}>{busy ? 'Requesting…' : 'Swap'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const look = StyleSheet.create({
  section: {
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    fontWeight: '700',
    color: '#747E87',
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    flex: 1,
    minHeight: 48,
    fontSize: 36,
    color: '#484859',
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  coinRow: {
    flexDirection: 'row',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F4F8',
    marginLeft: 6,
  },
  coinLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
    borderRadius: 10,
  },
  coinPillText: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  chevron: {
    width: 10,
    height: 10,
    marginLeft: 6,
    tintColor: '#747E87',
    transform: [{rotate: '90deg'}],
  },
  coinMenu: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#F4F7FB',
    overflow: 'hidden',
  },
  coinOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  fiatLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  fiatLineBelow: {
    marginTop: 6,
  },
  fiatInput: {
    minWidth: 12,
    color: '#747E87',
    fontSize: 14,
    padding: 0,
  },
  fiat: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
    marginLeft: 4,
  },
  max: {
    fontFamily: 'Satoshi Variable',
    color: '#2C72FF',
    fontWeight: '700',
    fontSize: 14,
  },
  fromLine: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
    fontFamily: 'Satoshi Variable',
    color: '#484859',
    fontSize: 14,
  },
  flipWrap: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 0,
    zIndex: 2,
  },
  flipLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: '#E4E8EE',
  },
  flip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E8EE',
  },
  flipIcon: {
    width: 18,
    height: 18,
    tintColor: '#8B93A7',
    transform: [{rotate: '90deg'}],
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  receiver: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
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
  iconBtnOff: {
    opacity: 0.4,
  },
  toolIcon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
  receiverPick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2C72FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  receiverPickText: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2C72FF',
    fontSize: 14,
    marginRight: 8,
  },
  receiverAddr: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
    marginLeft: 8,
  },
  emptyReceivers: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
    padding: 14,
  },
  manage: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saved: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2C72FF',
    fontSize: 14,
  },
  unconfirmed: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
    marginTop: 6,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  advancedLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 13,
  },
  chevronOpen: {
    transform: [{rotate: '270deg'}],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  settingRowLine: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  settingLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  settingValue: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 14,
  },
  scroller: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F2F8FD',
  },
  submit: {
    marginTop: 0,
    marginBottom: 0,
  },
});

export default CreateSwap;
