import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import HeaderButton from '../../components/Buttons/HeaderButton';
import SendConfirmation from '../../components/SendConfirmation';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {getSignedSellUrl, getSellTransactionHistory} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';
import {showError} from '../../reducers/errors';
import {fiatValueSelector} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import SuccessSell from '../../components/SuccessSell';

type RootStackParamList = {
  ConfirmSell: {
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
        throw new Error('Failed to Sell Litecoin URL (Moonpay)!');
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

  // handle ready to sell, confirm send.
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        dispatch(getSellTransactionHistory());

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
            label="Sell Litecoin via Moonpay"
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
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
  });

export const ConfirmSellNavigationOptions = (navigation: any) => {
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
        onPress={() => navigation.navigate('Main', {updateHeader: true})}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default ConfirmSell;
