import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import HeaderButton from '../../components/Buttons/HeaderButton';
import WhiteButton from '../../components/Buttons/WhiteButton';
import TranslateText from '../../components/TranslateText';
import SendConfirmation from '../../components/SendConfirmation';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {getSignedOnramperUrl} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';
import {showError} from '../../reducers/errors';
import {fiatValueSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmBuyOnramper: {
    queryString?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
  Main: {
    isInitial: boolean;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'ConfirmBuyOnramper'>;
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmBuyOnramper'>;
}

const ConfirmBuyOnramper: React.FC<Props> = props => {
  const {route} = props;
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Props['navigation']>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [hasBeenMounted, setHasBeenMounted] = useState(false);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [saleTxid, setSaleTxid] = useState('');
  const [toAmount, setToAmount] = useState(0);
  const [fiatAmount, setFiatAmount] = useState('');
  const [toAddress, setToAddress] = useState('');

  const {amount} = useAppSelector(state => state.input);
  const refundAddress = useAppSelector(state => state.address.address);
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));

  const openBuyWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(
        getSignedOnramperUrl(refundAddress, Number(amount)),
      );

      console.log(url);

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            // TODO: replace moonpay with onramper
            'https://api.nexuswallet.com/api/buy/moonpay/success_buy/',
          returnRoute: 'ConfirmBuyOnramper',
        });
      } else {
        throw new Error('Failed to Buy Litecoin URL (Onramper)!');
      }
    } catch (error) {
      dispatch(showError(String(error)));
    }
  };

  useEffect(() => {
    dispatch(getAddress(false));
    openBuyWidget();
    setHasBeenMounted(true);
  }, [dispatch]);

  // if exited WebPage before successful buy, go back!
  useFocusEffect(
    React.useCallback(() => {
      if (hasBeenMounted && hasNavigatedBack && !route.params?.queryString) {
        navigation.goBack();
      }
    }, [hasBeenMounted, hasNavigatedBack, route.params]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setHasNavigatedBack(true);
    });

    return unsubscribe;
  }, [navigation]);

  // handle ready to buy, confirm send.
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        // transactionId={{id}}
        // &baseCurrencyCode={{code}}
        // &baseCurrencyAmount={{amount}}
        // &depositWalletAddress={{address}}
        // &depositWalletAddressTag={{tag}}
        const buyRequest = parseQueryString(route.params.queryString);

        setSaleTxid(buyRequest.transactionId);
        setToAmount(Number(buyRequest.baseCurrencyAmount) * 100000000);
        setToAddress(buyRequest.depositWalletAddress);
        setFiatAmount(calculateFiatAmount(buyRequest.baseCurrencyAmount));
        console.log(buyRequest);
      }
    }
  }, [route.params]);

  const SuccessScreen = (
    <>
      <View style={styles.body}>
        <TranslateText
          textKey="awesome"
          domain="settingsTab"
          textStyle={styles.title}
        />
        <TranslateText
          textKey="buy_success"
          domain="buyTab"
          textStyle={styles.subtitle}
          interpolationObj={{
            amount: toAmount,
          }}
        />

        <View style={styles.toAddressContainer}>
          <Text style={styles.toAddressText}>{saleTxid}</Text>
        </View>
      </View>

      <View style={styles.confirmButtonContainer}>
        <WhiteButton
          textKey="back_to_wallet"
          textDomain="settingsTab"
          disabled={false}
          small={true}
          active={true}
          onPress={() => {
            navigation.navigate('Main', {isInitial: true});
          }}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        {saleTxid === '' ? (
          // WebPage is open
          <></>
        ) : saleTxid !== '' && paymentSuccess === false ? (
          // WebPage closed & ready for payment
          // <SendConfirmation
          //   toAddress={toAddress}
          //   amount={toAmount}
          //   fiatAmount={fiatAmount}
          //   label=""
          //   sendSuccessHandler={txid => {
          //     console.log(txid);
          //     setPaymentSuccess(true);
          //   }}
          // />
          <></>
        ) : (
          // payment success!
          SuccessScreen
        )}
      </LinearGradient>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.07,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.016,
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
      width: '100%',
      height: screenHeight * 0.1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
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
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
  });

export const ConfirmBuyOnramperNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'buy_litecoin'}
        domain={'buyTab'}
        numberOfLines={1}
        textStyle={styles.headerTitle}
      />
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmBuyOnramper;
