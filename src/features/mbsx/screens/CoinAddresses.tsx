import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {
  Alert,
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
import {DrawerScreenProps} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {getCoinPrices, validateAddress} from '../adapter';
import {forgetAddress, rememberAddress} from '../addressesSlice';
import {formatPrice} from 'react-native-nitro-bsx';
import {formatTimestamp, plainAddress} from '../format';
import {useShowUtcTimes} from '../stateText';
import {getMbsxStyles} from '../theme';
import MbsxBackButton from '../components/MbsxBackButton';
import CopyButton from '../components/CopyButton';
import {useBottomInset} from '../components/useBottomInset';
import {COIN_ICONS, swapCards} from '../swapCards';
import type {MbsxCoinPrices, MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CoinAddresses'>;

const CoinAddresses: React.FC<Props> = ({navigation, route}) => {
  const utc = useShowUtcTimes();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
  const dispatch = useAppDispatch();

  const {coin} = route.params;
  const savedRaw = useAppSelector(
    state => state.mbsxAddresses.byCoin[coin] ?? [],
  );
  const saved = savedRaw;
  const running = useAppSelector(state => state.mbsx.running);

  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [addressError, setAddressError] = useState('');
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const showField = (key: string) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max((fieldY.current[key] ?? 0) - 12, 0),
        animated: true,
      });
    }, 80);
  };

  const [prices, setPrices] = useState<MbsxCoinPrices | null>(null);
  const price = prices?.prices?.[coin];

  // Polled: `running` goes true when initialise() returns, which is before the
  // bridge handshake that carries the prices, and the server refreshes them on
  // its own clock afterwards.
  useFocusEffect(
    useCallback(() => {
      const readPrices = () =>
        setPrices(getCoinPrices());
      readPrices();
      const timer = setInterval(readPrices, 10000);
      return () => clearInterval(timer);
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({
      title: `${coin} Addresses`,
      headerLeft: () => <MbsxBackButton onPress={() => navigation.goBack()} />,
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation, coin]);

  // Scan pops back onto this screen with the result merged into its params.
  const scanned = route.params?.scanData;
  useEffect(() => {
    if (scanned) {
      setAddress(plainAddress(scanned));
    }
  }, [scanned]);

  const add = () => {
    const trimmed = address.trim();
    if (!trimmed) {
      return;
    }
    if (!validateAddress(coin, trimmed)) {
      setAddressError(`Not a ${coin} address`);
      return;
    }
    setAddressError('');
    dispatch(rememberAddress({coin, address: trimmed, label: label.trim()}));
    setAddress('');
    setLabel('');
  };

  const forget = (savedAddress: string) => {
    Alert.alert('Remove Address', 'Remove this saved address?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          dispatch(forgetAddress({coin, address: savedAddress}));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: bottom + keyboardHeight},
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={swapCards.card}>
          <View style={swapCards.pair}>
            {COIN_ICONS[coin] ? (
              <Image source={COIN_ICONS[coin]} style={swapCards.coinLogo} />
            ) : null}
            <Text style={swapCards.pairText}>{coin}</Text>
          </View>
          {price ? (
            <>
              <Text testID="mbsx-coin-price" style={swapCards.meta}>
                {`1 ${coin} = ${formatPrice(price)} ${prices?.currency}`}
              </Text>
              <Text style={swapCards.id}>
                {`Updated ${formatTimestamp(prices?.updated_at ?? '', utc)}`}
              </Text>
            </>
          ) : (
            <Text testID="mbsx-coin-price" style={swapCards.meta}>
              {running ? 'No Price Available' : 'Starting…'}
            </Text>
          )}
        </View>

        <View
          style={swapCards.card}
          onLayout={event => {
            fieldY.current.form = event.nativeEvent.layout.y;
          }}>
          <Text style={styles.inputLabel}>{`${coin} Address`}</Text>
          <View style={look.receiverRow}>
            <TextInput
              testID="mbsx-address-input"
              style={look.receiver}
              placeholder="Address"
              placeholderTextColor="#9AA0AE"
              value={address}
              onChangeText={value => {
                setAddress(value);
                setAddressError('');
              }}
              autoCapitalize="none"
            />
            <TouchableOpacity
              testID="mbsx-address-paste"
              style={look.iconBtn}
              onPress={async () => {
                const text = plainAddress(await Clipboard.getString());
                if (text) {
                  setAddress(text);
                  setAddressError('');
                }
              }}>
              <Image
                source={require('../../../assets/images/paste.png')}
                style={look.toolIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="mbsx-address-scan"
              style={look.iconBtn}
              onPress={() =>
                navigation.getParent()?.navigate('Scan', {
                  returnRoute: 'MbsxStack',
                  returnScreen: 'CoinAddresses',
                })
              }>
              <Image
                source={require('../../../assets/images/qrcode-btn.png')}
                style={look.toolIcon}
              />
            </TouchableOpacity>
          </View>
          {addressError !== '' ? (
            <Text testID="mbsx-address-error" style={styles.error}>
              {addressError}
            </Text>
          ) : null}
          <Text style={styles.inputLabel}>Label</Text>
          <TextInput
            testID="mbsx-address-label"
            style={look.receiver}
            placeholder="Optional"
            placeholderTextColor="#9AA0AE"
            value={label}
            onChangeText={setLabel}
            onFocus={() => showField('form')}
          />
        </View>
        <TouchableOpacity
          testID="mbsx-address-add"
          style={[
            styles.button,
            !address.trim() ? styles.buttonDisabled : null,
          ]}
          disabled={!address.trim()}
          onPress={add}>
          <Text style={styles.buttonText}>Save Address</Text>
        </TouchableOpacity>

        <Text style={swapCards.section}>Saved</Text>
        {saved.length === 0 ? (
          <View style={swapCards.card}>
            <Text style={swapCards.note}>No addresses</Text>
          </View>
        ) : (
          saved.map(entry => (
            <View
              key={entry.address}
              style={swapCards.card}
              onLayout={event => {
                fieldY.current[entry.address] = event.nativeEvent.layout.y;
              }}>
              <TextInput
                testID={`mbsx-saved-label-${entry.address}`}
                style={look.labelInput}
                placeholder="Add a Label"
                placeholderTextColor="#9AA0AE"
                defaultValue={entry.label}
                onFocus={() => showField(entry.address)}
                onEndEditing={event => {
                  const next = event.nativeEvent.text.trim();
                  if (next !== entry.label) {
                    dispatch(
                      rememberAddress({
                        coin,
                        address: entry.address,
                        label: next,
                      }),
                    );
                  }
                }}
              />
              <View style={look.receiverRow}>
                <View style={look.savedAddress}>
                  <Text style={look.savedAddressText} selectable>
                    {entry.address}
                  </Text>
                </View>
                <CopyButton
                  testID={`mbsx-copy-${entry.address}`}
                  label="Copy Address"
                  value={entry.address}
                  style={look.iconBtn}
                />
              </View>
              <TouchableOpacity
                testID={`mbsx-forget-${entry.address}`}
                style={styles.buttonSecondary}
                onPress={() => forget(entry.address)}>
                <Text style={styles.buttonSecondaryText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const look = StyleSheet.create({
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelInput: {
    borderRadius: 22,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    fontWeight: '700',
    color: '#484859',
  },
  savedAddress: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  savedAddressText: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
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
  toolIcon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
});

export default CoinAddresses;
