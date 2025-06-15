import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import HeaderButton from '../../components/Buttons/HeaderButton';
import SendConfirmation from '../../components/SendConfirmation';
import SuccessSell from '../../components/SuccessSell';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {
  getSignedSellOnramperUrl,
  getSellTransactionHistory,
} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';
import {showError} from '../../reducers/errors';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmSellOnramper: {
    queryString?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
  Main: {
    isInitial?: boolean;
    updateHeader?: boolean;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'ConfirmSellOnramper'>;
  navigation: StackNavigationProp<RootStackParamList, 'ConfirmSellOnramper'>;
}

const ConfirmSellOnramper: React.FC<Props> = props => {
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

  const openSellWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(
        getSignedSellOnramperUrl(refundAddress, Number(amount)),
      );
      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            'https://api.nexuswallet.com/api/sell/onramper/success_sell/',
          returnRoute: 'ConfirmSellOnramper',
        });
      } else {
        throw new Error('Failed to Sell Litecoin URL (Onramper)!');
      }
    } catch (error) {
      dispatch(showError(String(error)));
    }
  };

  useEffect(() => {
    dispatch(getAddress(false));
    openSellWidget();
    setHasBeenMounted(true);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [dispatch]);

  // if exited WebPage before successful sell, go back!
  useFocusEffect(
    React.useCallback(() => {
      if (hasBeenMounted && hasNavigatedBack && !route.params?.queryString) {
        navigation.navigate('Main', {updateHeader: true});
      }
    }, [hasBeenMounted, hasNavigatedBack, route.params]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setHasNavigatedBack(true);
    });

    return unsubscribe;
  }, [navigation]);

  // handle ready to sell, confirm send
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        ///providerWalletAddress={{address}}
        // &offramp={{offramp_provider}}
        // &partnerContext={{context_id}}
        // &wallet={{address_of_utxos}}
        // &transactionId={{txid}}
        // &sourceCurrency={{ltc_litecoin}}
        // &targetCurrency={{currency_code}}
        // &inAmount={{ltc_amount}}
        // &outAmount={{fiat_amount}}
        // &paymentMethod={{payment_method}}
        // &totalFee={{total_fee}}
        // &countryCode={{country_code}}
        // &exchangeRate={{exchange_rate}}

        dispatch(getSellTransactionHistory());

        const sellRequest = parseQueryString(route.params.queryString);

        setSaleTxid(sellRequest.transactionId);
        setToAmount(Number(sellRequest.inAmount) * 100000000);
        setToAddress(sellRequest.providerWalletAddress);
        setFiatAmount(sellRequest.outAmount);
      }
    }
  }, [route.params]);

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
            label="Sell Litecoin via Onramper"
            sendSuccessHandler={txid => {
              console.log(txid);
              setPaymentSuccess(true);
            }}
          />
        ) : (
          // payment success!
          <SuccessSell toAmount={toAmount} saleTxid={saleTxid} />
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

export const ConfirmSellOnramperNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
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
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() =>
          navigation.navigate('Main', {isInitial: true, updateHeader: true})
        }
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmSellOnramper;
