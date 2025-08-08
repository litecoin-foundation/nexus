import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSharedValue, withTiming} from 'react-native-reanimated';

import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
// import NewWhiteButton from '../Buttons/NewWhiteButton';
import WhiteButton from '../Buttons/WhiteButton';
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

type RootStackParamList = {
  Buy: undefined;
  SearchTransaction: {
    openFilter?: string;
  };
  ConfirmBuy: {
    prefilledMethod?: string;
  };
  ConfirmBuyOnramper: {
    prefilledMethod?: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Buy'>;
}

const Buy: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Props['navigation']>();

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

  const availableAmount =
    Number(amount) > 0 && (buyQuote?.ltcAmount || 0) > 0
      ? buyQuote.ltcAmount
      : Number(amount);
  const availableQuote =
    Number(amount) > 0 && (buyQuote?.baseCurrencyAmount || 0) > 0
      ? buyQuote.baseCurrencyAmount
      : Number(fiatAmount);

  const prefilledMethodRef = useRef<string>('');

  useEffect(() => {
    dispatch(checkAllowed());
    dispatch(setLimits());
  }, [dispatch]);

  const quoteUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const quoteAbortController = useRef<AbortController | null>(null);

  const onChange = (value: string, prefilledMethod?: string) => {
    prefilledMethodRef.current = prefilledMethod ? prefilledMethod : '';

    if (toggleLTC) {
      dispatch(updateAmount(value, 'buy'));
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value, 'buy'));
    }

    if (quoteUpdateTimeoutRef.current) {
      clearTimeout(quoteUpdateTimeoutRef.current);
    }
    if (quoteAbortController.current) {
      quoteAbortController.current.abort();
    }

    quoteUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        quoteAbortController.current = new AbortController();

        if (
          toggleLTC &&
          Number(value) >= minLTCBuyAmount &&
          Number(value) <= maxLTCBuyAmount
        ) {
          dispatch(setBuyQuote(Number(value)));
        } else if (
          !toggleLTC &&
          Number(value) >= minBuyAmount &&
          Number(value) <= maxBuyAmount
        ) {
          dispatch(setBuyQuote(undefined, Number(value)));
        }

        dispatch(callRates());
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Quote update error:', error);
        }
      }
    }, 300); // 300ms debounce for quote updates
  };

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());

      if (quoteUpdateTimeoutRef.current) {
        clearTimeout(quoteUpdateTimeoutRef.current);
      }
      if (quoteAbortController.current) {
        quoteAbortController.current.abort();
      }
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
        // setErrorTextKey('exceed_quote_limit');
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

    // NOTE(temp): neglect onramper amount limits
    if (isOnramperCustomer) {
      isAmountValidVar = true;
    }

    setAmountValid(isAmountValidVar);
    setRegionValid(isRegionValidVar);
    if (isAmountValidVar && isRegionValidVar) {
      setErrorTextKey('');
    }
  }, [isAmountValid, isRegionValid, isOnramperCustomer]);

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
          </View>
        </View>

        <View style={styles.presetButtons}>
          <WhiteButton
            value={toggleLTC ? '1' : `${currencySymbol}100`}
            onPress={() =>
              onChange(toggleLTC ? '1' : '100', toggleLTC ? 'ltc' : 'fiat')
            }
            active
            customStyles={styles.presetAmountBtn}
          />
          <WhiteButton
            value={toggleLTC ? '2' : `${currencySymbol}200`}
            onPress={() =>
              onChange(toggleLTC ? '2' : '200', toggleLTC ? 'ltc' : 'fiat')
            }
            active
            customStyles={styles.presetAmountBtn}
          />
          <WhiteButton
            value={toggleLTC ? '5' : `${currencySymbol}500`}
            onPress={() =>
              onChange(toggleLTC ? '5' : '500', toggleLTC ? 'ltc' : 'fiat')
            }
            active
            customStyles={styles.presetAmountBtn}
          />
          <WhiteButton
            value={toggleLTC ? '10' : `${currencySymbol}1k`}
            onPress={() =>
              onChange(toggleLTC ? '10' : '1000', toggleLTC ? 'ltc' : 'fiat')
            }
            active
            customStyles={styles.presetAmountBtn}
          />
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
        <View style={styles.buttons}>
          {/* <View style={styles.btn1}>
            <NewWhiteButton
              textKey="schedule_buy"
              textDomain="buyTab"
              disabled={!(regionValid && amountValid)}
              onPress={() => {}}
              imageSource={require('../../assets/icons/schedule-icon.png')}
            />
          </View> */}
          <View style={styles.btn2}>
            <BlueButton
              disabled={!(regionValid && amountValid)}
              textKey="preview_buy"
              textDomain="buyTab"
              onPress={() => {
                // NOTE: quote's polled every 15 sec but we have to
                // instant update it for preview
                dispatch(callRates());
                if (isMoonpayCustomer) {
                  navigation.navigate('ConfirmBuy', {
                    prefilledMethod: prefilledMethodRef.current,
                  });
                } else if (isOnramperCustomer) {
                  navigation.navigate('ConfirmBuyOnramper', {
                    prefilledMethod: prefilledMethodRef.current,
                  });
                } else {
                  return;
                }
              }}
            />
          </View>
        </View>
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
    },
    presetButtons: {
      flexDirection: 'row',
      gap: screenWidth * 0.015,
      marginTop: screenHeight * 0.03,
    },
    presetAmountBtn: {
      flex: 1,
      height: screenHeight * 0.055,
      borderRadius: screenHeight * 0.015,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.07,
      shadowRadius: 3,
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
    buttons: {
      flexDirection: 'row',
      gap: screenWidth * 0.015,
    },
    btn1: {
      flexBasis: '42%',
    },
    btn2: {
      flex: 1,
    },
    switchButton: {
      width: screenHeight * 0.05,
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.07,
      shadowRadius: 3,
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
