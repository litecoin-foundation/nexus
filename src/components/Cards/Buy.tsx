import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {checkAllowed, getLimits, getQuote} from '../../reducers/buy';
import {getPaymentRate, pollPaymentRate} from '../../reducers/ticker';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {
  resetInputs,
  updateAmount,
  updateFiatAmount,
} from '../../reducers/input';
import {RouteProp, useNavigation} from '@react-navigation/native';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';

interface Props {
  route: RouteProp<RootStackParamList, 'Main'>;
}

type RootStackParamList = {
  Main: undefined;
  ConfirmBuy: undefined;
};

const Buy: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const isBuyAllowed = useAppSelector(state => state.buy.isBuyAllowed);
  const minBuyAmount = useAppSelector(state => state.buy.minBuyAmount);
  const maxBuyAmount = useAppSelector(state => state.buy.maxBuyAmount);

  const [toggleLTC, setToggleLTC] = useState(true);
  const ltcFontSize = useSharedValue(24);
  const fiatFontSize = useSharedValue(18);

  useEffect(() => {
    dispatch(checkAllowed());
    dispatch(getLimits());
    dispatch(getQuote(1));
    dispatch(getPaymentRate());
  }, []);

  useEffect(() => {
    dispatch(pollPaymentRate());
  }, [dispatch]);

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value));
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value));
    }
  };

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const handleFontSizeChange = () => {
    if (toggleLTC) {
      ltcFontSize.value = withTiming(18);
      fiatFontSize.value = withTiming(24);
    } else {
      ltcFontSize.value = withTiming(24);
      fiatFontSize.value = withTiming(18);
    }
  };

  const BuyContainer = (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: 23.5,
          marginTop: 9,
        }}>
        <View style={{flexDirection: 'column'}}>
          <View style={{flexDirection: 'row'}}>
            <Animated.Text style={[styles.buyText, {fontSize: ltcFontSize}]}>
              Buy{' '}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.buyText,
                {color: '#2C72FF', fontSize: ltcFontSize},
              ]}>
              {amount === '' ? '0.00' : amount}
            </Animated.Text>
            <Animated.Text style={[styles.buyText, {fontSize: ltcFontSize}]}>
              {' '}
              LTC
            </Animated.Text>
          </View>

          <View style={{flexDirection: 'row'}}>
            <Animated.Text style={[styles.buyText, {fontSize: fiatFontSize}]}>
              for{' '}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.buyText,
                {color: '#20BB74', fontSize: fiatFontSize},
              ]}>
              {currencySymbol}
              {fiatAmount === '' ? '0.00' : fiatAmount}
            </Animated.Text>
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity
            onPress={() => {
              if (amount === '0.0000' && !toggleLTC) {
                dispatch(resetInputs());
              }
              setToggleLTC(!toggleLTC);
              handleFontSizeChange();
            }}
            style={styles.switchButton}>
            <Image source={require('../../assets/icons/switch-arrow.png')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('BuyHistory')}>
            <Image source={require('../../assets/icons/history-icon.png')} />
            <Text style={styles.buttonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.numpadContainer}>
        <BuyPad
          onChange={(value: string) => onChange(value)}
          currentValue={toggleLTC ? amount : fiatAmount}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {isBuyAllowed ? (
        BuyContainer
      ) : (
        <Text style={styles.disabledBuyText}>
          Buy Litecoin is currently not available in your country/state.
        </Text>
      )}
      <View style={styles.confirmButtonContainer}>
        <BlueButton
          disabled={
            !isBuyAllowed ||
            fiatAmount <= minBuyAmount ||
            fiatAmount === '' ||
            fiatAmount > maxBuyAmount
              ? true
              : false
          }
          value="Preview Buy"
          onPress={() => navigation.navigate('ConfirmBuy')}
        />
        <Text style={styles.minText}>
          Minimum purchase size of {currencySymbol}
          {minBuyAmount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    flexDirection: 'column',
    maxHeight: 680,
  },
  numpadContainer: {
    position: 'absolute',
    bottom: 218,
  },
  confirmButtonContainer: {
    marginHorizontal: 24,
    bottom: 141,
    position: 'absolute',
    width: Dimensions.get('screen').width - 48,
    gap: 6,
  },
  switchButton: {
    borderRadius: 10,
    backgroundColor: '#F3F3F3',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#F3F3F3',
    width: 98,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  buyText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 24,
  },
  buttonText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 12,
  },
  disabledBuyText: {
    marginTop: 30,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'center',
  },
  minText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'center',
  },
});

export default Buy;
