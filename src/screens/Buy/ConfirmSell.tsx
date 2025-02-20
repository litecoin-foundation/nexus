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
import {getSignedSellUrl} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';
import {showError} from '../../reducers/errors';

import {ScreenSizeContext} from '../../context/screenSize';
import {fiatValueSelector} from '../../reducers/ticker';

type RootStackParamList = {
  ConfirmSell: {
    queryString?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'ConfirmSell'>;
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSell'>;
}

const ConfirmSell: React.FC<Props> = props => {
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

  const openSellWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(
        getSignedSellUrl(refundAddress, Number(amount)),
      );

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            'https://api.nexuswallet.com/api/sell/moonpay/success_sell/',
          returnRoute: 'ConfirmSell',
        });
      } else {
        throw new Error('Failed to get Sell Litecoin URL (Moonpay)!');
      }
    } catch (error) {
      dispatch(showError(String(error)));
    }
  };

  useEffect(() => {
    dispatch(getAddress(false));
    openSellWidget();
    setHasBeenMounted(true);
  }, [dispatch]);

  // if exited WebPage before successful sell, go back!
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

  // handle ready to sell, confirm send.
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        // transactionId={{id}}
        // &baseCurrencyCode={{code}}
        // &baseCurrencyAmount={{amount}}
        // &depositWalletAddress={{address}}
        // &depositWalletAddressTag={{tag}}
        const sellRequest = parseQueryString(route.params.queryString);

        setSaleTxid(sellRequest.transactionId);
        setToAmount(Number(sellRequest.baseCurrencyAmount) * 100000000);
        setToAddress(sellRequest.depositWalletAddress);
        setFiatAmount(calculateFiatAmount(sellRequest.baseCurrencyAmount));
        console.log(sellRequest);
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
          textKey="sell_success"
          domain="sellTab"
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
          <SendConfirmation
            toAddress={toAddress}
            amount={toAmount}
            fiatAmount={fiatAmount}
            label=""
            sendSuccessHandler={txid => console.log(txid)}
          />
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

export const ConfirmSellNavigationOptions = navigation => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'sell_litecoin'}
        domain={'sellTab'}
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

export default ConfirmSell;
