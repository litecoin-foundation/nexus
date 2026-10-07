import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
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
import {useKeyboardHeight} from '../useKeyboardHeight';
import Clipboard from '@react-native-clipboard/clipboard';
import {AddressType, newAddress} from 'react-native-nitro-lndltc';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../../context/screenSize';
import {triggerLightFeedback} from '../../../utils/haptic';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {
  isHwWalletSelectedSelector,
  selectedAccountNamesSelector,
} from '../../../reducers/wallets';
import {
  rememberAddress,
  rememberDestination,
  setLastCoin,
} from '../addressesSlice';
import {COINS} from '../components/CoinSelector';
import {COIN_ICONS, coinPlate} from '../swapCards';
import {
  PAY_IN_COINS,
  createDeposit,
  getCoinPrices,
  getInfo,
  getSwapFundingOutputs,
  isRunning,
  parseAmount,
  readConfig,
  recordLeases,
  releasePrevouts,
  requestSwap,
  selectAndLeasePrevouts,
  serialisePrevout,
  swapBalances,
  validateAddress,
} from '../adapter';
import {independentReference} from '../rates';
import {getMbsxStyles} from '../theme';
import type {MbsxCoinPrices, MbsxDrawerParamList, MbsxInfo} from '../types';
import {
  RATE_TOLERANCE,
  coinString,
  slippageFor,
  useSwapAmounts,
} from '../useSwapAmounts';
import {
  NO_OFFERS_WARNING,
  offersAvailable,
  offersEstimateText,
  providersText,
  useOffersEstimate,
} from '../useOffersEstimate';
import {raisedFeeNote} from '../format';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CreateSwap'>;

// The coin lnd holds: a swap sends it from there, a pay-in receives it there.
const HOST_COIN = 'LTC';

const CHAIN_FEE_RESERVE = 10000n;

const swapFeeSats = (
  outputs: {value: number | bigint}[] | undefined,
): bigint =>
  (outputs ?? [])
    .slice(1)
    .reduce((sum, output) => sum + BigInt(output.value), 0n);
const feeCapNote = (funding: ReturnType<typeof getSwapFundingOutputs>) => {
  if (
    funding.error ||
    funding.total_fee_bps === undefined ||
    funding.max_fee_bps === undefined
  ) {
    return '';
  }
  const totalFee = Number(funding.total_fee_bps);
  const maxFee = Number(funding.max_fee_bps);
  return totalFee > maxFee
    ? `The swap server charges ${totalFee / 100}%, above your limit of ${maxFee / 100}%`
    : '';
};
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

// 36 fits eight characters beside the coin pill on a 320dp screen
const amountFontSize = (value: string) =>
  Math.max(18, Math.min(36, Math.floor(288 / Math.max(value.length, 1))));

const shortAddress = (address: string) =>
  address.length > 18
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;

const CoinMark = ({ticker}: {ticker?: string}) => (
  <View
    style={[
      look.coinCircle,
      {
        backgroundColor: coinPlate(ticker),
        borderWidth: ticker ? 0 : 1,
        borderColor: '#D5DBE4',
      },
    ]}>
    {ticker && COIN_ICONS[ticker] ? (
      <Image source={COIN_ICONS[ticker]} style={look.coinLogo} />
    ) : null}
  </View>
);

const CreateSwap: React.FC<Props> = ({navigation, route}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const lastCoin = useAppSelector(state => state.mbsxAddresses.lastCoin);
  const connected = useAppSelector(state => state.mbsx.connected);
  const torEnabled = useAppSelector(state => state.settings.torEnabled);
  const [torApplied, setTorApplied] = useState<boolean | null>(null);
  const [coinTo, setCoinTo] = useState(lastCoin);
  const [payIn, setPayIn] = useState(false);
  const [buyCoin, setBuyCoin] = useState(HOST_COIN);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyAddress, setBuyAddress] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [prices, setPrices] = useState<MbsxCoinPrices | null>(null);
  const [info, setInfo] = useState<MbsxInfo | null>(null);
  const slippage = slippageFor(info?.max_margin_bps);
  const slippageLabel = `${+(slippage * 100).toFixed(2)}%`;
  const [balances, setBalances] = useState<{
    spendable: bigint;
    unconfirmed: bigint;
  } | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [receiversOpen, setReceiversOpen] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const amountY = useRef({from: 0, to: 0});
  const showAmount = (which: 'from' | 'to') => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, amountY.current[which] - 8),
        animated: true,
      });
    }, 80);
  };
  const [spendNote, setSpendNote] = useState('');


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
      readConfig().then(cfg => live && setTorApplied(cfg?.proxy !== undefined));
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

  const sendCoin = payIn ? coinTo : HOST_COIN;
  const receiveCoin = payIn ? buyCoin : coinTo;
  const buysToHost = !payIn || buyCoin === HOST_COIN;
  const buyCoins = [HOST_COIN, ...offeredCoins].filter(coin => coin !== coinTo);

  // The handshake says which coins the server bridges; no request before it
  const unbridgedCoin =
    [sendCoin, receiveCoin].find(
          coin => coin !== '' && info?.coins[coin]?.bridge_supported !== true,
        );
  const bridgeNote = unbridgedCoin
    ? `The swap server has no bridge for ${unbridgedCoin}`
    : '';
  const torPending = torApplied !== null && torEnabled !== torApplied;

  const rates = useAppSelector(state => state.mbsx.rates ?? {});
  const reference = independentReference(
    rates,
    sendCoin,
    receiveCoin,
    Date.now() / 1000,
  );
  const glueFrom = Number(prices?.prices?.[sendCoin] ?? 0);
  const glueTo = Number(prices?.prices?.[receiveCoin] ?? 0);
  const priceFrom = reference ? reference.send : glueFrom;
  const priceTo = reference ? reference.receive : glueTo;
  const referenceName = reference
    ? `the ${reference.label}`
    : "the server's rate";
  const serverDeviation =
    reference && glueFrom > 0 && glueTo > 0
      ? glueFrom / glueTo / (reference.send / reference.receive) - 1
      : null;

  const {
    amounts,
    setAmount,
    fixedRate,
    setFixedRate,
    valueDeviation,
    reset: resetAmounts,
  } = useSwapAmounts(
    priceFrom > 0 ? String(priceFrom) : undefined,
    priceTo > 0 ? String(priceTo) : undefined,
    slippage,
  );
  const [rateAcknowledged, setRateAcknowledged] = useState(false);
  const offReference =
    valueDeviation !== null && Math.abs(valueDeviation) > RATE_TOLERANCE;
  const coinChosen = coinTo !== '';
  const addressInvalid =
    addressTo !== '' && coinChosen && !validateAddress(coinTo, addressTo);
  const buyAddressInvalid =
    !buysToHost && buyAddress !== '' && !validateAddress(buyCoin, buyAddress);
  const amountFrom = amounts.fromCoin;
  const amountTo = amounts.toCoin;

  // The cap is enforced at offer receipt; refusing here saves leasing coins
  const [feeNote, setFeeNote] = useState('');
  const [quote, setQuote] = useState<{
    feeBps: number;
    feeSats: bigint;
    unit: bigint;
    raisedFrom: bigint | null;
  } | null>(null);
  useEffect(() => {
    setFeeNote('');
    setSpendNote('');
    setQuote(null);
    if (
      amountFrom === '' ||
      sendCoin === '' ||
      receiveCoin === '' ||
      !isRunning()
    ) {
      return;
    }
    const funding = getSwapFundingOutputs(sendCoin, receiveCoin, amountFrom);
    if (funding.min_amount !== undefined) {
      setFeeNote(funding.error ?? '');
    }
    if (
      !funding.error &&
      funding.total_fee_bps !== undefined &&
      funding.max_fee_bps !== undefined
    ) {
      let unit: bigint;
      try {
        unit = parseAmount(sendCoin, '1');
      } catch {
        unit = 0n;
      }
      setQuote({
        feeBps: Number(funding.fee_bps ?? funding.total_fee_bps),
        feeSats: swapFeeSats(funding.outputs),
        unit,
        raisedFrom:
          funding.fees_raised && funding.nominal_fee_bps !== undefined
            ? funding.nominal_fee_bps
            : null,
      });
      setFeeNote(feeCapNote(funding));
    }
    if (payIn || !balances || !isRunning()) {
      return;
    }
    let amountSats: bigint;
    try {
      amountSats = parseAmount(HOST_COIN, amountFrom);
    } catch {
      return;
    }
    const feeSats = funding.error ? 0n : swapFeeSats(funding.outputs);
    if (amountSats + feeSats + CHAIN_FEE_RESERVE > balances.spendable) {
      setSpendNote(
        'That is more than you can spend. The network fee and the swap fee come out of this Litecoin.',
      );
    }
  }, [amountFrom, balances, payIn, receiveCoin, sendCoin]);

  const blockNote = bridgeNote || feeNote;

  const dispatch = useAppDispatch();
  const savedAddresses = useAppSelector(state =>
    coinTo ? (state.mbsxAddresses.byCoin[coinTo] ?? []) : [],
  );

  // Scan pops back onto this screen with the result in params.
  const scanned = route.params?.scanData;
  const addressFilledFor = useRef('');
  useEffect(() => {
    if (scanned) {
      setAddressTo(scanned);
      addressFilledFor.current = coinTo;
    }
  }, [scanned, coinTo]);

  useEffect(() => {
    if (!coinTo || addressFilledFor.current === coinTo) {
      return;
    }
    const last = savedAddresses[0]?.address;
    if (!last) {
      return;
    }
    addressFilledFor.current = coinTo;
    setAddressTo(last);
  }, [coinTo, savedAddresses]);

  // Rehydration can land after the first render, so the initial state above is
  // not enough on its own.
  useEffect(() => {
    if (!coinTo && lastCoin && (!payIn || PAY_IN_COINS.includes(lastCoin))) {
      setCoinTo(lastCoin);
    }
  }, [coinTo, lastCoin, payIn]);

  useEffect(() => {
    setRateAcknowledged(false);
  }, [amounts.fromCoin, amounts.toCoin]);

  const selectCoin = (coin: string) => {
    if (coin !== coinTo) {
      setAddressTo('');
      addressFilledFor.current = '';
    }
    setCoinTo(coin);
    setCoinOpen(false);
    dispatch(setLastCoin(coin));
    if (payIn && coin === buyCoin) {
      setBuyCoin(HOST_COIN);
      setBuyAddress('');
    }
  };

  const selectBuyCoin = (coin: string) => {
    setBuyCoin(coin);
    setBuyOpen(false);
    setBuyAddress('');
  };

  const flip = () => {
    const next = !payIn;
    setPayIn(next);
    setCoinOpen(false);
    setReceiversOpen(false);
    setBuyCoin(HOST_COIN);
    setBuyOpen(false);
    setBuyAddress('');
    setError('');
    resetAmounts();
    if (next && !PAY_IN_COINS.includes(coinTo)) {
      setCoinTo('');
      setAddressTo('');
      addressFilledFor.current = '';
    }
  };

  const isHwWallet = useAppSelector(isHwWalletSelectedSelector);
  const {ltcAccount} = useAppSelector(selectedAccountNamesSelector);
  const walletName = ltcAccount
    ? `Nexus Wallet: ${ltcAccount}`
    : 'Nexus Wallet';

  const submit = async () => {
    setConfirming(false);
    triggerLightFeedback();
    setRequestId('');
    setError('');
    setBusy(true);
    try {
      if (!isRunning()) {
        throw new Error('Swaps are not running');
      }
      if (!coinTo) {
        throw new Error(payIn ? 'Select a coin to pay' : 'Select a coin to receive');
      }
      if (!offeredCoins.includes(coinTo)) {
        throw new Error(`${coinTo} is disabled`);
      }
      if (!addressTo) {
        throw new Error(
          payIn ? 'Missing refund address' : 'Missing receive address',
        );
      }
      if (!validateAddress(coinTo, addressTo)) {
        throw new Error(`Not a ${coinTo} address`);
      }
      // Amounts are entered in whole coins; the module holds the only conversion.
      try {
        parseAmount(sendCoin, amountFrom);
      } catch {
        throw new Error('Invalid amount to send');
      }
      // Parsed only to reject it here: the module is sent the string. Leasing
      // coins and then failing on the receive amount would strand them.
      try {
        parseAmount(receiveCoin, amountTo);
      } catch {
        throw new Error('Invalid amount to receive');
      }
      const quoted = getSwapFundingOutputs(sendCoin, receiveCoin, amountFrom);
      if (quoted.min_amount !== undefined) {
        setFeeNote(quoted.error ?? '');
        throw new Error(quoted.error);
      }
      const capNote = feeCapNote(quoted);
      if (capNote) {
        setFeeNote(capNote);
        throw new Error(capNote);
      }
      if (payIn) {
        if (!buysToHost && !offeredCoins.includes(buyCoin)) {
          throw new Error(`${buyCoin} is disabled`);
        }
        if (!buysToHost && !buyAddress) {
          throw new Error('Missing receive address');
        }
        if (!buysToHost && !validateAddress(buyCoin, buyAddress)) {
          throw new Error(`Not a ${buyCoin} address`);
        }
        let receiveAddress = buyAddress;
        if (buysToHost) {
          const receive = await newAddress({
            type: AddressType.UNUSED_WITNESS_PUBKEY_HASH,
            account: ltcAccount,
          });
          if (!receive?.address) {
            throw new Error('Could not get a receive address');
          }
          receiveAddress = receive.address;
        }
        const deposit = createDeposit({
          coin_from: coinTo,
          amount_from: amountFrom,
          coin_to: buyCoin,
          min_amount_to: amountTo,
          refund_address: addressTo,
          address_to: receiveAddress,
        });
        dispatch(rememberAddress({coin: coinTo, address: addressTo}));
        if (!buysToHost) {
          dispatch(rememberAddress({coin: buyCoin, address: buyAddress}));
        }
        resetAmounts();
        setAddressTo('');
        setBuyAddress('');
        setRateAcknowledged(false);
        navigation.navigate('PayInDetail', {depositId: deposit.deposit_id});
        return;
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

      const funding = getSwapFundingOutputs(HOST_COIN, receiveCoin, amountFrom);
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
          coin_from: HOST_COIN,
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
      dispatch(
        rememberDestination({requestId: rv.request_id, address: addressTo}),
      );
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

  const fillMax = () => {
    if (!balances) {
      return;
    }
    const probe = coinString(Number(balances.spendable) / 1e8);
    const funding =
      probe && receiveCoin
        ? getSwapFundingOutputs(HOST_COIN, receiveCoin, probe)
        : null;
    const feeSats = funding && !funding.error ? swapFeeSats(funding.outputs) : 0n;
    const room = balances.spendable - feeSats - CHAIN_FEE_RESERVE;
    setAmount(
      'from',
      'coin',
      coinString(Number(room > 0n ? room : 0n) / 1e8),
    );
  };
  const spendableLabel =
    coinString(Number(balances?.spendable ?? 0n) / 1e8) || '0';
  const selectedSaved = savedAddresses.find(
    entry => entry.address === addressTo,
  );
  const currency = reference ? 'USD' : (prices?.currency ?? 'USD');

  const from = Number(amountFrom);
  const to = Number(amountTo);
  const rateLine =
    coinChosen && from > 0 && to > 0
      ? `1 ${sendCoin} ≈ ${coinString(to / from)} ${receiveCoin}`
      : '';
  const marketRate =
    coinChosen && priceFrom > 0 && priceTo > 0
      ? `1 ${sendCoin} ≈ ${coinString(priceFrom / priceTo)} ${receiveCoin}`
      : '';
  const marketLabel = reference
    ? reference.label
    : marketRate
      ? "Server's rate, not checked"
      : '';
  const feeLine =
    quote && quote.feeBps > 0
      ? `Swap fee ${quote.feeBps / 100}%${
          quote.feeSats > 0n && quote.unit > 0n
            ? ` (${coinString(Number(quote.feeSats) / Number(quote.unit))} ${sendCoin})`
            : ''
        }`
      : '';
  const raisedNote =
    feeLine !== '' && quote?.raisedFrom != null
      ? raisedFeeNote(quote.raisedFrom)
      : '';
  const noSaved = coinChosen && savedAddresses.length === 0;

  useEffect(() => {
    setConfirming(false);
  }, [amountFrom, amountTo, addressTo, coinTo, payIn, buyCoin, buyAddress]);

  const estimate = useOffersEstimate(
    confirming && payIn && coinTo
      ? {
          coin_from: coinTo,
          amount_from: amountFrom,
          coin_to: buyCoin,
          min_amount_to: amountTo,
        }
      : null,
  );
  const [noOffersAcknowledged, setNoOffersAcknowledged] = useState(false);
  useEffect(() => {
    setNoOffersAcknowledged(false);
  }, [confirming]);
  const noOffers =
    payIn && estimate?.state === 'answered' && !offersAvailable(estimate);
  const providersLine = providersText(estimate);

  const confirmSwap = () => {
    if (
      !coinTo ||
      !addressTo ||
      !amountFrom ||
      !amountTo ||
      addressInvalid ||
      (!buysToHost && (!buyAddress || buyAddressInvalid))
    ) {
      void submit();
      return;
    }
    setConfirming(true);
  };

  const menuCoins = payIn
    ? offeredCoins.filter(coin => PAY_IN_COINS.includes(coin))
    : offeredCoins;
  const hostPill = (
    <View style={look.coinPill}>
      <CoinMark ticker={HOST_COIN} />
      <Text style={look.coinPillText}>{HOST_COIN}</Text>
    </View>
  );
  const coinPill = (
    <TouchableOpacity
      testID="mbsx-coin-pill"
      style={look.coinPill}
      onPress={() => setCoinOpen(open => !open)}>
      <CoinMark ticker={coinTo || undefined} />
      <Text style={look.coinPillText}>{coinTo || 'Coin'}</Text>
      <Image
        source={require('../../../assets/images/forward.png')}
        style={look.chevron}
      />
    </TouchableOpacity>
  );
  const buyPill = (
    <TouchableOpacity
      testID="mbsx-buy-pill"
      style={look.coinPill}
      onPress={() => setBuyOpen(open => !open)}>
      <CoinMark ticker={buyCoin} />
      <Text style={look.coinPillText}>{buyCoin}</Text>
      <Image
        source={require('../../../assets/images/forward.png')}
        style={look.chevron}
      />
    </TouchableOpacity>
  );
  const buyMenu = buyOpen ? (
    <View style={look.coinMenu}>
      {buyCoins.map(coin => (
        <TouchableOpacity
          key={coin}
          testID={`mbsx-buy-${coin}`}
          accessibilityState={{selected: buyCoin === coin}}
          style={look.coinOption}
          onPress={() => selectBuyCoin(coin)}>
          <CoinMark ticker={coin} />
          <Text style={look.coinPillText}>{coin}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;
  const coinMenu = coinOpen ? (
    <View style={look.coinMenu}>
      {menuCoins.map(coin => (
        <TouchableOpacity
          key={coin}
          testID={`mbsx-coin-${coin}`}
          accessibilityState={{selected: coinTo === coin}}
          style={look.coinOption}
          onPress={() => selectCoin(coin)}>
          <CoinMark ticker={coin} />
          <Text style={look.coinPillText}>{coin}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;
  const addressBlock = (
    <>
      {coinChosen ? null : (
        <Text testID="mbsx-select-coin-note" style={styles.rowMessage}>
          {payIn
            ? 'Select the coin to pay first'
            : 'Select the coin to receive first'}
        </Text>
      )}
      <TextInput
        key={coinChosen ? 'address-on' : 'address-off'}
        testID="mbsx-address-to"
        style={[look.receiver, coinChosen ? null : styles.inputDisabled]}
        placeholder={payIn ? 'Refund Address' : 'Receive Address'}
        placeholderTextColor="#9AA0AE"
        value={addressTo}
        onChangeText={setAddressTo}
        editable={coinChosen}
        autoCapitalize="none"
      />
      {addressInvalid ? (
        <Text testID="mbsx-address-error" style={styles.error}>
          Not a {coinTo} address
        </Text>
      ) : null}
      <View style={look.receiverRow}>
        <TouchableOpacity
          testID="mbsx-addresses"
          disabled={!coinChosen}
          style={[
            look.receiverPick,
            look.receiverPickFlex,
            coinChosen ? null : look.iconBtnOff,
          ]}
          onPress={() =>
            noSaved
              ? navigation.navigate('CoinAddresses', {coin: coinTo})
              : setReceiversOpen(open => !open)
          }>
          <Text style={look.receiverPickText} numberOfLines={1}>
            {selectedSaved?.label ||
              (addressTo
                ? shortAddress(addressTo)
                : noSaved
                  ? `Add a ${coinTo} Address`
                  : 'Select Receiver')}
          </Text>
          <Image
            source={require('../../../assets/images/forward.png')}
            style={look.chevron}
          />
        </TouchableOpacity>
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
            source={require('../../../assets/images/paste.png')}
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
            <Text style={look.saved}>Manage Addresses</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <ScrollView
        ref={scrollRef}
        style={look.scroller}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.scroll,
          keyboardHeight > 0 ? {paddingBottom: 24} : null,
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={look.section}>Send</Text>
        <View
          style={look.card}
          onLayout={event => {
            amountY.current.from = event.nativeEvent.layout.y;
          }}>
          <View style={look.amountRow}>
            <TextInput
              testID="mbsx-amount-from"
              style={[
                look.amount,
                {fontSize: amountFontSize(amounts.fromCoin)},
              ]}
              placeholder="0"
              placeholderTextColor="#C5C5CE"
              value={amounts.fromCoin}
              onChangeText={value => setAmount('from', 'coin', numericAmount(value))}
              keyboardType="decimal-pad"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              onFocus={() => showAmount('from')}
            />
            {payIn ? coinPill : hostPill}
          </View>
          {payIn ? coinMenu : null}
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
                onFocus={() => showAmount('from')}
              />
              <Text style={look.fiat}>{currency}</Text>
            </View>
            {payIn ? null : (
              <TouchableOpacity
                testID="mbsx-max"
                disabled={!balances}
                onPress={fillMax}>
                <Text style={look.max}>{`Max. ${spendableLabel} ${HOST_COIN}`}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!payIn && balances && balances.unconfirmed > 0n ? (
            <Text style={look.unconfirmed}>
              {`${coinString(Number(balances.unconfirmed) / 1e8)} ${HOST_COIN} unconfirmed`}
            </Text>
          ) : null}
          <Text style={look.fromLine}>
            {payIn ? 'From Another Wallet' : `From ${walletName}`}
          </Text>
          {payIn ? addressBlock : null}
          {spendNote !== '' ? (
            <Text testID="mbsx-spend-note" style={styles.error}>
              {spendNote}
            </Text>
          ) : null}
        </View>

        <View style={look.flipWrap}>
          <View style={look.flipLine} />
          <TouchableOpacity testID="mbsx-flip" style={look.flip} onPress={flip}>
            <Image
              source={require('../../../assets/icons/switch-arrow.png')}
              style={look.flipIcon}
            />
          </TouchableOpacity>
        </View>

        <Text style={look.section}>Receive</Text>
        <View
          style={look.card}
          onLayout={event => {
            amountY.current.to = event.nativeEvent.layout.y;
          }}>
          <View style={look.amountRow}>
            <TextInput
              testID="mbsx-amount-to"
              style={[look.amount, {fontSize: amountFontSize(amounts.toCoin)}]}
              placeholder="0"
              placeholderTextColor="#C5C5CE"
              value={amounts.toCoin}
              onChangeText={value => setAmount('to', 'coin', numericAmount(value))}
              keyboardType="decimal-pad"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              onFocus={() => showAmount('to')}
            />
            {payIn ? buyPill : coinPill}
          </View>
          {payIn ? buyMenu : coinMenu}
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
              onFocus={() => showAmount('to')}
            />
            <Text style={look.fiat}>{currency}</Text>
          </View>
          {!payIn ? (
            addressBlock
          ) : buysToHost ? (
            <Text style={look.fromLine}>
              {`To ${walletName}`}
            </Text>
          ) : (
            <>
              <TextInput
                testID="mbsx-buy-address"
                style={look.receiver}
                placeholder="Receive Address"
                placeholderTextColor="#9AA0AE"
                value={buyAddress}
                onChangeText={setBuyAddress}
                autoCapitalize="none"
              />
              {buyAddressInvalid ? (
                <Text testID="mbsx-buy-address-error" style={styles.error}>
                  Not a {buyCoin} address
                </Text>
              ) : null}
            </>
          )}
        </View>

        {rateLine !== '' || feeLine !== '' || marketRate !== '' ? (
          <View testID="mbsx-quote" style={look.quote}>
            {rateLine !== '' ? (
              <View style={look.quoteRow}>
                <Text style={look.quoteLabel}>Rate</Text>
                <Text style={look.quoteValue}>{rateLine}</Text>
              </View>
            ) : null}
            {marketRate !== '' ? (
              <View
                style={[
                  look.quoteRow,
                  rateLine !== '' ? look.quoteRowLine : null,
                ]}>
                <Text style={look.quoteLabel}>{marketLabel}</Text>
                <Text testID="mbsx-reference" style={look.quoteValue}>
                  {marketRate}
                </Text>
              </View>
            ) : null}
            {feeLine !== '' ? (
              <Text
                style={[
                  look.quoteFee,
                  rateLine !== '' || marketRate !== '' ? look.quoteRowLine : null,
                ]}>
                {feeLine}
              </Text>
            ) : null}
            {raisedNote !== '' ? (
              <Text testID="mbsx-fee-raised" style={styles.rowMessage}>
                {raisedNote}
              </Text>
            ) : null}
          </View>
        ) : null}

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
              <Text style={look.settingLabel}>Fix Rate</Text>
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
                <Text style={look.settingValue}>{slippageLabel}</Text>
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
              } than ${referenceName}.${
                rateAcknowledged ? '' : ' Tap this warning to continue anyway.'
              }`}
            </Text>
          </TouchableOpacity>
        ) : null}
        {serverDeviation !== null &&
        Math.abs(serverDeviation) > RATE_TOLERANCE ? (
          <Text testID="mbsx-server-price-note" style={styles.error}>
            {`The server's prices differ from ${referenceName} by ${Math.round(
              Math.abs(serverDeviation) * 100,
            )}%.`}
          </Text>
        ) : null}
        {torPending ? (
          <Text testID="mbsx-tor-pending" style={styles.rowMessage}>
            Tor is on in Nexus. It applies to this swap after you leave and
            come back, or after the app restarts while a swap is in flight.
          </Text>
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
      <View
        style={[
          look.footer,
          {
            paddingBottom:
              keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 12),
          },
        ]}>
        {confirming ? (
          <View testID="mbsx-confirm" style={look.confirmCard}>
            <Text style={look.confirmTitle}>Confirm Swap</Text>
            <Text style={look.confirmLine}>
              {payIn
                ? `Pay ${amountFrom} ${sendCoin} from another wallet`
                : `Send ${amountFrom} ${sendCoin}`}
            </Text>
            <Text style={look.confirmLine}>
              {`Receive ${amountTo} ${receiveCoin}`}
            </Text>
            <Text style={look.confirmLine} numberOfLines={2}>
              {payIn ? `Refund to ${addressTo}` : `To ${addressTo}`}
            </Text>
            {buysToHost ? null : (
              <Text style={look.confirmLine} numberOfLines={2}>
                {`To ${buyAddress}`}
              </Text>
            )}
            {rateLine ? (
              <Text style={look.confirmLine}>{rateLine}</Text>
            ) : null}
            {feeLine ? <Text style={look.confirmLine}>{feeLine}</Text> : null}
            {raisedNote ? (
              <Text style={look.confirmNote}>{raisedNote}</Text>
            ) : null}
            {payIn ? (
              <>
                <Text testID="mbsx-offers-estimate" style={look.confirmLine}>
                  {`Offers Now: ${offersEstimateText(estimate)}`}
                </Text>
                {providersLine ? (
                  <Text style={look.confirmLine}>{providersLine}</Text>
                ) : null}
                <Text style={look.confirmNote}>
                  An estimate: offers can be withdrawn before your payment
                  confirms.
                </Text>
              </>
            ) : null}
            {noOffers ? (
              <TouchableOpacity
                testID="mbsx-no-offers-warning"
                onPress={() => setNoOffersAcknowledged(true)}>
                <Text style={styles.error}>
                  {`${NO_OFFERS_WARNING}${
                    noOffersAcknowledged
                      ? ''
                      : ' Tap this warning to continue anyway.'
                  }`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {confirming ? (
          <View style={look.confirmActions}>
            <TouchableOpacity
              testID="mbsx-confirm-cancel"
              style={[styles.buttonSecondary, look.confirmAction]}
              onPress={() => setConfirming(false)}
              disabled={busy}>
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="mbsx-submit"
              style={[
                styles.button,
                look.submit,
                look.confirmAction,
                busy || blockNote !== '' || (noOffers && !noOffersAcknowledged)
                  ? styles.buttonDisabled
                  : null,
              ]}
              onPress={() => void submit()}
              disabled={
                busy || blockNote !== '' || (noOffers && !noOffersAcknowledged)
              }>
              <Text style={styles.buttonText}>
                {busy ? 'Requesting…' : 'Get Offers'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            testID="mbsx-submit"
            style={[
              styles.button,
              look.submit,
              busy ||
              !connected ||
              !coinChosen ||
              addressInvalid ||
              buyAddressInvalid ||
              blockNote !== '' ||
              (offReference && !rateAcknowledged)
                ? styles.buttonDisabled
                : null,
            ]}
            onPress={confirmSwap}
            disabled={
              busy ||
              !connected ||
              !coinChosen ||
              addressInvalid ||
              buyAddressInvalid ||
              blockNote !== '' ||
              (offReference && !rateAcknowledged)
            }>
            <Text style={styles.buttonText}>
              {busy ? 'Requesting…' : 'Get Offers'}
            </Text>
          </TouchableOpacity>
        )}
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
    marginLeft: 6,
  },
  coinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  coinLogo: {
    width: 32,
    height: 32,
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
    marginTop: 10,
  },
  receiverPickFlex: {
    flex: 1,
    marginTop: 0,
  },
  receiver: {
    flex: 1,
    marginTop: 16,
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
  quote: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  quoteRowLine: {
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
  quoteFee: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
    paddingVertical: 12,
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
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  confirmTitle: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 16,
    color: '#484859',
    marginBottom: 8,
  },
  confirmLine: {
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#484859',
    marginTop: 4,
  },
  confirmNote: {
    fontFamily: 'Satoshi Variable',
    fontSize: 12,
    color: '#747E87',
    marginTop: 4,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmAction: {
    flex: 1,
    marginVertical: 0,
  },
  submit: {
    marginTop: 0,
    marginBottom: 0,
  },
});

export default CreateSwap;
