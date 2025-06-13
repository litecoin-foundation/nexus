import React, {
  useEffect,
  useLayoutEffect,
  useCallback,
  useContext,
  useState,
} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import TableCell from '../../components/Cells/TableCell';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';
import GreenButton from '../../components/Buttons/GreenButton';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {getSignedUrl, getBuyTransactionHistory} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {showError} from '../../reducers/errors';
import {parseQueryString} from '../../lib/utils/querystring';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmBuy: {
    queryString?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
  Main: {
    isInitial: boolean;
    updateHeader: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmBuy'>;
  route: RouteProp<RootStackParamList, 'ConfirmBuy'>;
}

interface LeftHeaderProps {
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmBuy'>;
}

const LeftHeaderButton: React.FC<LeftHeaderProps> = props => {
  const {navigation} = props;
  return (
    <HeaderButton
      textKey="back"
      textDomain="buyTab"
      onPress={() =>
        navigation.navigate('Main', {isInitial: true, updateHeader: true})
      }
      imageSource={require('../../assets/images/back-icon.png')}
    />
  );
};

const ConfirmBuy: React.FC<Props> = props => {
  const {navigation, route} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [buyTxid, setBuyTxid] = useState<string>('');
  const [buyTxStatus, setBuyTxStatus] = useState<string>('');
  const [wasSuccessful, setWasSuccessful] = useState<boolean>(false);

  const {buyQuote: quote} = useAppSelector(state => state.buy);
  const {currencySymbol} = useAppSelector(state => state.settings);
  const {
    ltcAmount,
    ltcPrice,
    totalAmount,
    baseCurrencyAmount,
    networkFeeAmount,
    feeAmount,
    discount,
  } = quote;

  const address = useAppSelector(state => state.address.address);

  useLayoutEffect(() => {
    dispatch(getAddress());
  });

  const openBuyWidget = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Address not found. Go back and Try again!');
      }

      if (!baseCurrencyAmount) {
        throw new Error('Purchase amount not found.');
      }

      // await is important!
      const url = await dispatch(getSignedUrl(address, baseCurrencyAmount));

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            'https://api.nexuswallet.com/api/buy/moonpay/success_buy/',
          returnRoute: 'ConfirmBuy',
        });
      } else {
        throw new Error('Failed to Buy Litecoin URL (Moonpay)!');
      }
    } catch (error) {
      dispatch(showError(String(error)));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [address, baseCurrencyAmount]);

  // handle successful purchase
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        dispatch(getBuyTransactionHistory());
        setWasSuccessful(true);

        navigation.setOptions({
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <LeftHeaderButton navigation={navigation} />,
        });

        const parsedQueryString = parseQueryString(route.params.queryString);
        if (parsedQueryString) {
          if (parsedQueryString.hasOwnProperty('transactionId')) {
            setBuyTxid(parsedQueryString.transactionId);
          }
          if (parsedQueryString.hasOwnProperty('transactionStatus')) {
            setBuyTxStatus(parsedQueryString.transactionStatus);
          }
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [route.params, navigation]);

  const SuccessScreen = (
    <>
      <View style={styles.body}>
        <TranslateText
          textKey="awesome"
          domain="settingsTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.07}
          textStyle={styles.title}
          numberOfLines={1}
        />
        <TranslateText
          textKey="buy_success"
          domain="buyTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={styles.subtitle}
          numberOfLines={2}
        />
        {buyTxid ? (
          <View style={styles.toAddressContainer}>
            <TranslateText
              textValue={buyTxid}
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.toAddressText}
              numberOfLines={4}
            />
          </View>
        ) : (
          <></>
        )}
      </View>
      <View style={styles.confirmButtonContainer}>
        <WhiteButton
          textKey="back_to_wallet"
          textDomain="settingsTab"
          disabled={false}
          active
          onPress={() => {
            navigation.navigate('Main', {isInitial: true, updateHeader: true});
          }}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {wasSuccessful ? (
        SuccessScreen
      ) : (
        <>
          <CustomSafeAreaView
            styles={styles.safeArea}
            edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}>
            <View style={styles.topContainer}>
              <TranslateText
                textKey={'purchasing'}
                domain={'buyTab'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                textStyle={styles.titleText}
                numberOfLines={1}
              />
              <TranslateText
                textValue={`${ltcAmount} LTC`}
                maxSizeInPixels={SCREEN_HEIGHT * 0.08}
                textStyle={styles.amountText}
                numberOfLines={1}
              />
              <View style={styles.fiatAmount}>
                <TranslateText
                  textValue={`${currencySymbol}${totalAmount.toFixed(2)}`}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.05}
                  textStyle={styles.fiatAmountText}
                  numberOfLines={1}
                />
              </View>
            </View>

            <View style={styles.bottomSheetContainer}>
              <TableCell
                titleTextKey="rate"
                titleTextDomain="buyTab"
                value={`${currencySymbol}${ltcPrice.toFixed(2)} per 1 LTC`}
                noBorder
              />
              <TableCell
                titleTextKey="total_fee"
                titleTextDomain="main"
                value={`${currencySymbol}${feeAmount.toFixed(2)}`}
              />
              <TableCell
                titleTextKey="network_fee"
                titleTextDomain="main"
                value={`${currencySymbol}${networkFeeAmount.toFixed(2)}`}
              />
              <TableCell
                titleTextKey="will_spend"
                titleTextDomain="buyTab"
                value={`${currencySymbol}${totalAmount.toFixed(2)}`}
                valueStyle={{color: '#20BB74'}}
              />
              <View style={styles.confirmButtonContainer}>
                <GreenButton
                  textKey="continue_purchase"
                  textDomain="buyTab"
                  onPress={() => openBuyWidget()}
                />
              </View>
            </View>
          </CustomSafeAreaView>
        </>
      )}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1162E6',
    },
    safeArea: {
      flex: 1,
      justifyContent: 'space-between',
    },
    topContainer: {
      paddingHorizontal: screenWidth * 0.04,
    },
    bottomSheetContainer: {
      width: '100%',
      height: screenHeight * 0.36,
      backgroundColor: 'white',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      paddingTop: screenWidth * 0.04,
      overflow: 'hidden',
    },
    titleText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontStyle: 'normal',
      fontWeight: '700',
      marginTop: screenHeight * 0.1,
    },
    amountText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.06,
      fontStyle: 'normal',
      fontWeight: '400',
      marginTop: screenHeight * 0.01,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: screenWidth * 0.04,
      width: screenWidth - screenWidth * 0.08,
    },
    fiatAmount: {
      width: 'auto',
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.01,
      paddingHorizontal: screenHeight * 0.015,
      alignSelf: 'flex-start',
      marginTop: screenHeight * 0.01,
    },
    fiatAmountText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
      opacity: 0.4,
    },
    body: {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.03,
    },
    title: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.07,
      fontStyle: 'normal',
      fontWeight: '700',
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
      fontStyle: 'normal',
      fontWeight: '700',
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    toAddressContainer: {
      width: 'auto',
      height: 'auto',
      borderRadius: screenHeight * 0.012,
      backgroundColor: 'rgba(240, 240, 240, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: screenHeight * 0.05,
      paddingLeft: screenWidth * 0.05,
      paddingRight: screenWidth * 0.05,
      paddingTop: screenWidth * 0.02,
      paddingBottom: screenWidth * 0.02,
    },
    toAddressText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontStyle: 'normal',
      fontWeight: '500',
      textAlign: 'center',
    },
  });

export const ConfirmBuyNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        textKey="change"
        textDomain="buyTab"
        onPress={() =>
          navigation.navigate('Main', {isInitial: true, updateHeader: true})
        }
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmBuy;
