import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppDispatch, useAppSelector} from '../../../store/hooks';
import {getCoinPrices} from '../adapter';
import {forgetAddress, rememberAddress} from '../addressesSlice';
import {formatPrice, formatUpdatedAt} from 'react-native-nitro-bsx';
import {getMbsxStyles} from '../theme';
import type {MbsxCoinPrices, MbsxDrawerParamList} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'CoinAddresses'>;

const CoinAddresses: React.FC<Props> = ({navigation, route}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const dispatch = useAppDispatch();

  const {coin} = route.params;
  const saved = useAppSelector(state => state.mbsxAddresses.byCoin[coin] ?? []);
  const running = useAppSelector(state => state.mbsx.running);

  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [prices, setPrices] = useState<MbsxCoinPrices | null>(null);
  const price = prices?.prices?.[coin];

  // Polled: `running` goes true when initialise() returns, which is before the
  // bridge handshake that carries the prices, and the server refreshes them on
  // its own clock afterwards.
  useFocusEffect(
    useCallback(() => {
      setPrices(getCoinPrices());
      const timer = setInterval(() => setPrices(getCoinPrices()), 10000);
      return () => clearInterval(timer);
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({title: `${coin} addresses`});
  }, [navigation, coin]);

  // Scan pops back onto this screen with the result merged into its params.
  const scanned = route.params?.scanData;
  useEffect(() => {
    if (scanned) {
      setAddress(scanned);
    }
  }, [scanned]);

  const add = () => {
    const trimmed = address.trim();
    if (!trimmed) {
      return;
    }
    dispatch(rememberAddress({coin, address: trimmed, label: label.trim()}));
    setAddress('');
    setLabel('');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stackedRow}>
          {price ? (
            <>
              <Text testID="mbsx-coin-price" style={styles.rowPrimary}>
                {`1 ${coin} = ${formatPrice(price)} ${prices?.currency}`}
              </Text>
              <Text style={styles.rowMessage}>
                {`Updated ${formatUpdatedAt(prices?.updated_at ?? '')}`}
              </Text>
            </>
          ) : (
            <Text testID="mbsx-coin-price" style={styles.rowMessage}>
              {running ? 'No price available' : 'Starting…'}
            </Text>
          )}
        </View>

        <Text style={styles.inputLabel}>{`${coin} address`}</Text>
        <TextInput
          testID="mbsx-address-input"
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
        />
        <Text style={styles.inputLabel}>Label</Text>
        <TextInput
          testID="mbsx-address-label"
          style={styles.input}
          placeholder="Optional"
          value={label}
          onChangeText={setLabel}
        />
        <TouchableOpacity
          testID="mbsx-address-scan"
          onPress={() =>
            navigation.getParent()?.navigate('Scan', {
              returnRoute: 'MbsxStack',
              returnScreen: 'CoinAddresses',
            })
          }>
          <Text style={styles.link}>Scan a QR code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="mbsx-address-add"
          style={[
            styles.button,
            !address.trim() ? styles.buttonDisabled : null,
          ]}
          disabled={!address.trim()}
          onPress={add}>
          <Text style={styles.buttonText}>Save address</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Saved</Text>
        {saved.length === 0 ? (
          <Text style={styles.empty}>No addresses</Text>
        ) : (
          saved.map(entry => (
            <View key={entry.address} style={styles.stackedRow}>
              {entry.label ? (
                <Text style={styles.rowPrimary}>{entry.label}</Text>
              ) : null}
              <Text style={styles.rowMessage}>{entry.address}</Text>
              <TouchableOpacity
                testID={`mbsx-forget-${entry.address}`}
                onPress={() =>
                  dispatch(forgetAddress({coin, address: entry.address}))
                }>
                <Text style={styles.link}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default CoinAddresses;
