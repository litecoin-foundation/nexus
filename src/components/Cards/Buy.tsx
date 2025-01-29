import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {checkAllowed, getLimits, getBuyQuote} from '../../reducers/buy';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {
  resetInputs,
  updateAmount,
  updateFiatAmount,
} from '../../reducers/input';
import {useNavigation} from '@react-navigation/native';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Buy: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const isBuyAllowed = useAppSelector(state => state.buy.isBuyAllowed);
  const minBuyAmount = useAppSelector(state => state.buy.minBuyAmount);
  const maxBuyAmount = useAppSelector(state => state.buy.maxBuyAmount);
  const minLTCBuyAmount = useAppSelector(state => state.buy.minLTCBuyAmount);
  const maxLTCBuyAmount = useAppSelector(state => state.buy.maxLTCBuyAmount);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [toggleLTC, setToggleLTC] = useState(true);
  const ltcFontSize = useSharedValue(SCREEN_HEIGHT * 0.024);
  const fiatFontSize = useSharedValue(SCREEN_HEIGHT * 0.018);

  useEffect(() => {
    dispatch(checkAllowed());
    dispatch(getLimits());
    dispatch(getBuyQuote(1));
  }, [dispatch]);

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value, 'buy'));
      // fetch quote from moonpay
      if (
        Number(value) >= minLTCBuyAmount &&
        Number(value) <= maxLTCBuyAmount
      ) {
        dispatch(getBuyQuote(Number(value)));
      }
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value, 'buy'));
      if (Number(value) >= minBuyAmount && Number(value) <= maxBuyAmount) {
        dispatch(getBuyQuote(undefined, Number(value)));
      }
    }
  };

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const handleFontSizeChange = () => {
    if (toggleLTC) {
      ltcFontSize.value = withTiming(SCREEN_HEIGHT * 0.018);
      fiatFontSize.value = withTiming(SCREEN_HEIGHT * 0.024);
    } else {
      ltcFontSize.value = withTiming(SCREEN_HEIGHT * 0.024);
      fiatFontSize.value = withTiming(SCREEN_HEIGHT * 0.018);
    }
  };

  const BuyContainer = (
    <>
      <View style={styles.buyContainer}>
        <View style={styles.buyControls}>
          <View style={styles.flexCol}>
            <View style={styles.flexRow}>
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

            <View style={styles.flexRow}>
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

          <View style={styles.controlBtns}>
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
              onPress={() =>
                navigation.navigate('SearchTransaction', {openFilter: 'Buy'})
              }>
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
      <View style={isBuyAllowed ? styles.bottom : styles.bottomStandalone}>
        <BlueButton
          disabled={
            !isBuyAllowed ||
            Number(fiatAmount) <= minBuyAmount ||
            fiatAmount === '' ||
            Number(fiatAmount) > maxBuyAmount
              ? true
              : false
          }
          value="Preview Buy"
          onPress={() => {
            navigation.navigate('ConfirmBuy');
          }}
        />
        <Text style={isBuyAllowed ? styles.minText : {display: 'none'}}>
          Minimum purchase size of {currencySymbol}
          {minBuyAmount}
        </Text>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      // DashboardButton is 110
      width: screenWidth,
      height: screenHeight * 0.76 - 110,
      backgroundColor: '#f7f7f7',
      paddingHorizontal: screenWidth * 0.06,
    },
    buyContainer: {
      flexBasis: '80%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buyControls: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.01,
    },
    flexCol: {
      flexDirection: 'column',
    },
    flexRow: {
      flexDirection: 'row',
    },
    controlBtns: {
      flexDirection: 'row',
      gap: 8,
      // History button's border is 1
      marginRight: screenWidth * 0.06 * -1 - 1,
    },
    numpadContainer: {
      width: screenWidth,
    },
    bottom: {
      flexBasis: '20%',
      width: '100%',
      marginVertical: screenHeight * 0.03,
    },
    bottomStandalone: {
      flex: 1,
      justifyContent: 'flex-end',
      width: '100%',
      marginVertical: screenHeight * 0.03,
    },
    switchButton: {
      borderRadius: screenHeight * 0.01,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      backgroundColor: '#fff',
      width: screenHeight * 0.05,
      height: screenHeight * 0.05,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyButton: {
      borderTopLeftRadius: screenHeight * 0.01,
      borderBottomLeftRadius: screenHeight * 0.01,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      borderRightColor: 'white',
      backgroundColor: '#fff',
      width: screenHeight * 0.1,
      height: screenHeight * 0.05,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    buyText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.024,
    },
    buttonText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
    },
    disabledBuyText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      textAlign: 'center',
      marginTop: screenHeight * 0.03,
    },
    minText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      textAlign: 'center',
      marginTop: screenHeight * 0.01,
    },
  });

export default Buy;
