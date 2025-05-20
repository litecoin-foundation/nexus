import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSharedValue, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {checkAllowed, setSellQuote} from '../../reducers/buy';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {
  resetInputs,
  updateAmount,
  updateFiatAmount,
} from '../../reducers/input';
import {estimateFee} from 'react-native-turbo-lnd';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Sell: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const balance = useAppSelector(state => state.balance.confirmedBalance);
  const balanceMinus001 = Number(balance) - 1000000;
  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const isSellAllowed = useAppSelector(state => state.buy.isSellAllowed);
  const {minLTCSellAmount, maxLTCSellAmount} = useAppSelector(
    state => state.buy.sellLimits,
  );
  const {
    isMoonpayCustomer,
    isOnramperCustomer,
    proceedToGetSellLimits,
    sellQuote,
  } = useAppSelector(state => state.buy);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [toggleLTC, setToggleLTC] = useState(true);
  const ltcFontSize = useSharedValue(SCREEN_HEIGHT * 0.024);
  const fiatFontSize = useSharedValue(SCREEN_HEIGHT * 0.018);

  // render moonpay rates
  const availableAmount =
    Number(amount) > 0 && sellQuote.ltcAmount > 0
      ? sellQuote.ltcAmount
      : Number(amount);
  const availableQuote =
    Number(amount) > 0 && sellQuote.fiatAmount > 0
      ? sellQuote.fiatAmount
      : Number(fiatAmount);

  useEffect(() => {
    dispatch(checkAllowed());
    dispatch(setSellQuote(1));
  }, [dispatch]);

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value, 'sell'));
      // set quote from moonpay
      if (
        Number(value) >= minLTCSellAmount &&
        Number(value) <= maxLTCSellAmount
      ) {
        dispatch(setSellQuote(Number(value)));
      }
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value, 'sell'));
    }
  };

  // wait fot amount update to set quote from moonpay
  useEffect(() => {
    if (!toggleLTC) {
      if (
        Number(amount) >= minLTCSellAmount &&
        Number(amount) <= maxLTCSellAmount
      ) {
        dispatch(setSellQuote(Number(amount)));
      }
    }
  }, [dispatch, toggleLTC, amount, minLTCSellAmount, maxLTCSellAmount]);

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

  const [sellOutFee, setSellOutFee] = useState(0);
  // estimate fee
  useEffect(() => {
    const calculateFee = async () => {
      try {
        const response = await estimateFee({
          AddrToAmount: {
            ['MQd1fJwqBJvwLuyhr17PhEFx1swiqDbPQS']: BigInt(balanceMinus001),
          },
          targetConf: 2,
        });
        setSellOutFee(Number(response.feeSat));
      } catch (error) {
        console.error(error);
      }
    };

    calculateFee();
  }, [balanceMinus001]);

  function amountValid(): boolean {
    if (!isSellAllowed) {
      return false;
    }
    // balance in SATS, amount in LTC
    if (Number(balance) < Number(amount) * 100000000) {
      return false;
    }
    if (
      !availableQuote ||
      !availableAmount ||
      Number(availableAmount) < minLTCSellAmount ||
      Number(availableAmount) > maxLTCSellAmount
    ) {
      return false;
    }
    return true;
  }

  const SellContainer = (
    <>
      <View style={styles.sellContainer}>
        <View style={styles.sellControls}>
          <View style={styles.flexCol}>
            <View style={styles.flexRow}>
              <TranslateText
                textKey={'sell'}
                domain={'sellTab'}
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
                dispatch(
                  updateAmount(
                    parseFloat(
                      String(
                        Number(balance) / 100000000 - sellOutFee / 100000000,
                      ),
                    ).toFixed(6),
                    'sell',
                  ),
                );
              }}
              style={styles.maxButton}>
              <TranslateText
                textValue="MAX"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.buttonText}
                numberOfLines={1}
              />
            </TouchableOpacity>

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
                navigation.navigate('SearchTransaction', {openFilter: 'Sell'})
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
      {isSellAllowed ? (
        SellContainer
      ) : (
        <TranslateText
          textKey="sell_blocked"
          domain="sellTab"
          textStyle={styles.disabledBuyText}
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        />
      )}
      <View style={isSellAllowed ? styles.bottom : styles.bottomStandalone}>
        <BlueButton
          disabled={proceedToGetSellLimits ? false : !amountValid()}
          textKey="preview_sell"
          textDomain="sellTab"
          onPress={() => {
            if (isMoonpayCustomer) {
              navigation.navigate('ConfirmSell');
            } else if (isOnramperCustomer) {
              navigation.navigate('ConfirmSellOnramper');
            } else {
              return;
            }
          }}
        />
        {proceedToGetSellLimits ? null : (
          <TranslateText
            textKey={'min_sale'}
            domain={'buyTab'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={isSellAllowed ? styles.minText : {display: 'none'}}
            numberOfLines={1}
            interpolationObj={{
              currencySymbol,
              minAmount: minLTCSellAmount,
              maxAmount: maxLTCSellAmount,
            }}
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
    sellContainer: {
      flexBasis: '80%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sellControls: {
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
    maxButton: {
      borderRadius: screenHeight * 0.01,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      backgroundColor: '#fff',
      width: 'auto',
      minWidth: screenHeight * 0.05,
      height: screenHeight * 0.05,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: screenWidth * 0.02,
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

export default Sell;
