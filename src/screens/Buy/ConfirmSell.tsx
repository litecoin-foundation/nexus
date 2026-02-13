import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
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
import {getSignedSellUrl, getSellTransactionHistory} from '../../reducers/buy';
import {parseQueryString} from '../../utils/querystring';
import {showError} from '../../reducers/errors';
import {confirmSellFiatValueSelector} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ConfirmSell: {
    queryString?: string;
    prefilledMethod?: string;
  };
  WebPage: {
    uri: string;
    observeURL: string;
    returnRoute: string;
  };
  Main: {
    isInitial?: boolean;
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
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const [hasBeenMounted, setHasBeenMounted] = useState(false);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [saleTxid, setSaleTxid] = useState('');
  const [toAmount, setToAmount] = useState(0);
  const [toAddress, setToAddress] = useState('');

  const {amount} = useAppSelector(state => state.input);
  const refundAddress = useAppSelector(state => state.address.address);
  const calculateFiatAmount = useAppSelector(state =>
    confirmSellFiatValueSelector(state),
  );
  const [fiatAmount, setFiatAmount] = useState('0.00');

  const handleSendSuccess = useCallback((txid: string) => {
    console.log(txid);
    setPaymentSuccess(true);
  }, []);

  const openSellWidget = useCallback(async () => {
    try {
      // await is important!
      const url = await dispatch(
        getSignedSellUrl(
          refundAddress,
          Number(amount),
          route.params.prefilledMethod || '',
        ),
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
  }, [
    dispatch,
    refundAddress,
    amount,
    navigation,
    route.params.prefilledMethod,
  ]);

  useEffect(() => {
    dispatch(getAddress(false));
    if (!route.params?.queryString) {
      openSellWidget();
    }
    setHasBeenMounted(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [dispatch]);

  // if exited WebPage before successful sell, go back!
  useFocusEffect(
    React.useCallback(() => {
      if (hasBeenMounted && hasNavigatedBack && !route.params?.queryString) {
        navigation.goBack();
      }
    }, [hasBeenMounted, hasNavigatedBack, route.params, navigation]),
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
        setFiatAmount(
          calculateFiatAmount(Number(sellRequest.baseCurrencyAmount)),
        );
      }
    }
  }, [route.params, dispatch, calculateFiatAmount]);

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
            sendSuccessHandler={handleSendSuccess}
          />
        ) : (
          <SuccessSell toAmount={toAmount} saleTxid={saleTxid} />
        )}
      </LinearGradient>
    </View>
  );
};

const getStyles = (_screenWidth: number, _screenHeight: number) =>
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

export const ConfirmSellNavigationOptions = (
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
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default ConfirmSell;
