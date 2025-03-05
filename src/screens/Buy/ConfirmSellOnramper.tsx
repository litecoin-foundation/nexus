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
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import {getSignedSellOnramperUrl} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';
import {showError} from '../../reducers/errors';

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
    isInitial: boolean;
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

  const [sellTxId, setSellTxId] = useState<string>('');

  const [hasBeenMounted, setHasBeenMounted] = useState(false);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);

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
            // TODO: replace moonpay with onramper
            'https://api.nexuswallet.com/api/sell/moonpay/success_sell/',
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
        navigation.goBack();
      }
      /* eslint-disable react-hooks/exhaustive-deps */
    }, [hasBeenMounted, hasNavigatedBack, route.params]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setHasNavigatedBack(true);
    });

    return unsubscribe;
  }, [navigation]);

  // handle successful purchase
  useEffect(() => {
    if (route.params) {
      if (route.params.queryString) {
        // transactionId={{transactionId}}
        // &transactionStatus=pending
        console.log(route.params.queryString);
        // parse qs & set values to state!
        const sellSuccess = parseQueryString(route.params.queryString);
        setSellTxId(sellSuccess.transactionId);
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
        />

        <View style={styles.toAddressContainer}>
          <Text style={styles.toAddressText}>{sellTxId}</Text>
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
        {sellTxId === '' ? (
          // WebPage is open
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

export const ConfirmSellOnramperNavigationOptions = (navigation: any) => {
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

export default ConfirmSellOnramper;
