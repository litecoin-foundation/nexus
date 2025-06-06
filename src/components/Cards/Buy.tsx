import React, {useEffect, useState, useContext, useCallback} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSharedValue, withTiming} from 'react-native-reanimated';

import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {checkAllowed, setLimits, setBuyQuote} from '../../reducers/buy';
import {
  resetInputs,
  updateAmount,
  updateFiatAmount,
} from '../../reducers/input';
import {callRates} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Buy: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const isBuyAllowed = useAppSelector(state => state.buy.isBuyAllowed);
  const {minBuyAmount, maxBuyAmount, minLTCBuyAmount, maxLTCBuyAmount} =
    useAppSelector(state => state.buy.buyLimits);
  const {
    isMoonpayCustomer,
    isOnramperCustomer,
    proceedToGetBuyLimits,
    buyQuote,
  } = useAppSelector(state => state.buy);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [toggleLTC, setToggleLTC] = useState(true);
  const ltcFontSize = useSharedValue(SCREEN_HEIGHT * 0.024);
  const fiatFontSize = useSharedValue(SCREEN_HEIGHT * 0.018);

  // render moonpay rates
  const availableAmount =
    Number(amount) > 0 && buyQuote.ltcAmount > 0
      ? buyQuote.ltcAmount
      : Number(amount);
  const availableQuote =
    Number(amount) > 0 && buyQuote.baseCurrencyAmount > 0
      ? buyQuote.baseCurrencyAmount
      : Number(fiatAmount);

  useEffect(() => {
    dispatch(checkAllowed());
    dispatch(setLimits());
    // dispatch(setBuyQuote(1));
  }, [dispatch]);

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value, 'buy'));
      // set quote from moonpay
      if (
        Number(value) >= minLTCBuyAmount &&
        Number(value) <= maxLTCBuyAmount
      ) {
        dispatch(setBuyQuote(Number(value)));
      }
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value, 'buy'));
      if (Number(value) >= minBuyAmount && Number(value) <= maxBuyAmount) {
        dispatch(setBuyQuote(undefined, Number(value)));
      }
    }
    // update quote
    dispatch(callRates());
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

  const [errorTextKey, setErrorTextKey] = useState('');
  const [amountValid, setAmountValid] = useState(true);
  const [regionValid, setRegionValid] = useState(true);

  const isAmountValid = useCallback(() => {
    if (isMoonpayCustomer) {
      if (
        !availableQuote ||
        !availableAmount ||
        Number(availableQuote) < minBuyAmount ||
        Number(availableQuote) > maxBuyAmount
      ) {
        setErrorTextKey('exceed_quote_limit');
        return false;
      }
    }
    return true;
  }, [
    isMoonpayCustomer,
    availableQuote,
    availableAmount,
    minBuyAmount,
    maxBuyAmount,
  ]);

  const isRegionValid = useCallback(() => {
    if (!isMoonpayCustomer && !isOnramperCustomer) {
      setErrorTextKey('buy_blocked');
      return false;
    }
    if (!isBuyAllowed) {
      setErrorTextKey('try_another_currency');
      return false;
    }
    return true;
  }, [isMoonpayCustomer, isOnramperCustomer, isBuyAllowed]);

  useEffect(() => {
    let isAmountValidVar = isAmountValid();
    let isRegionValidVar = isRegionValid();
    setAmountValid(isAmountValidVar);
    setRegionValid(isRegionValidVar);
    if (isAmountValidVar && isAmountValidVar) {
      setErrorTextKey('');
    }
  }, [isAmountValid, isRegionValid]);

  const BuyContainer = (
    <>
      <View style={styles.buyContainer}>
        <View style={styles.buyControls}>
          <View style={styles.flexCol}>
            <View style={styles.flexRow}>
              <TranslateText
                textKey={'buy'}
                domain={'buyTab'}
                textStyle={styles.buyText}
                animatedFontSizeValue={ltcFontSize}
                numberOfLines={1}
              />
              <TranslateText
                textKey={'n_ltc'}
                domain={'buyTab'}
                textStyle={{...styles.buyText, color: '#2C72FF'}}
                animatedFontSizeValue={ltcFontSize}
                numberOfLines={1}
                interpolationObj={{
                  amount: toggleLTC
                    ? amount === ''
                      ? '0.00'
                      : amount
                    : !availableAmount
                      ? '0.00'
                      : availableAmount,
                }}
              />
              <TranslateText
                textValue=" LTC"
                textStyle={styles.buyText}
                animatedFontSizeValue={ltcFontSize}
                numberOfLines={1}
              />
            </View>

            <View style={styles.flexRow}>
              <TranslateText
                textKey={'for'}
                domain={'buyTab'}
                textStyle={styles.buyText}
                animatedFontSizeValue={fiatFontSize}
                numberOfLines={1}
              />
              <TranslateText
                textKey={'for_total'}
                domain={'buyTab'}
                textStyle={{...styles.buyText, color: '#20BB74'}}
                animatedFontSizeValue={fiatFontSize}
                numberOfLines={1}
                interpolationObj={{
                  currencySymbol,
                  total: toggleLTC
                    ? !availableQuote
                      ? '0.00'
                      : availableQuote
                    : fiatAmount === ''
                      ? '0.00'
                      : fiatAmount,
                }}
              />
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
              <TranslateText
                textKey={'history'}
                domain={'buyTab'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.buttonText}
                numberOfLines={1}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.numpadContainer}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={toggleLTC ? amount : fiatAmount}
            small
          />
        </View>
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
      ]}>
      {regionValid ? (
        BuyContainer
      ) : (
        <TranslateText
          textKey={errorTextKey}
          domain="buyTab"
          textStyle={styles.disabledBuyText}
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        />
      )}
      <View style={regionValid ? styles.bottom : styles.bottomStandalone}>
        <BlueButton
          disabled={!(regionValid && amountValid)}
          textKey="preview_buy"
          textDomain="buyTab"
          onPress={() => {
            // NOTE: quote's polled every 15 sec but we have to
            // instant update it for preview
            dispatch(callRates());
            if (isMoonpayCustomer) {
              navigation.navigate('ConfirmBuy');
            } else if (isOnramperCustomer) {
              navigation.navigate('ConfirmBuyOnramper');
            } else {
              return;
            }
          }}
        />
        {errorTextKey ? (
          <View
            style={
              regionValid ? styles.underButtonNotification : {display: 'none'}
            }>
            <TranslateText
              textKey={errorTextKey}
              domain={'buyTab'}
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.minText}
              numberOfLines={1}
            />
            <TranslateText
              textValue=" "
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.minText}
              numberOfLines={1}
            />
            {proceedToGetBuyLimits ? null : (
              <TranslateText
                textKey={'min_purchase'}
                domain={'buyTab'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={styles.minText}
                numberOfLines={1}
                interpolationObj={{
                  currencySymbol,
                  minAmountInFiat: minBuyAmount,
                }}
              />
            )}
          </View>
        ) : proceedToGetBuyLimits ? null : (
          <TranslateText
            textKey={'min_purchase'}
            domain={'buyTab'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.minText}
            numberOfLines={1}
            interpolationObj={{currencySymbol, minAmountInFiat: minBuyAmount}}
          />
        )}
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
      marginVertical: screenHeight * 0.02,
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
    underButtonNotification: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
  });

export default Buy;
