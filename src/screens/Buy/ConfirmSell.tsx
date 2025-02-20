import React, {useContext, useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
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
import {getSignedSellUrl} from '../../reducers/buy';
import {parseQueryString} from '../../lib/utils/querystring';

import {ScreenSizeContext} from '../../context/screenSize';

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
  const [saleTxid, setSaleTxid] = useState('');
  const [saleAmount, setSaleAmount] = useState(0);

  const {amount} = useAppSelector(state => state.input);
  const {address} = useAppSelector(state => state.address);

  const openSellWidget = async () => {
    try {
      // await is important!
      const url = await dispatch(getSignedSellUrl(address, Number(amount)));

      if (typeof url === 'string') {
        navigation.navigate('WebPage', {
          uri: url,
          observeURL:
            'https://api.nexuswallet.com/api/sell/moonpay/success_sell/',
          returnRoute: 'ConfirmSell',
        });
      } else {
        console.log(url);
        Alert.alert("Something's wrong!", `${url}`);
      }
    } catch (error) {
      Alert.alert("Something's wrong!", `err: ${error}`);
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

  // handle successful sale!
  useEffect(() => {
    if (route.params.queryString) {
      // transactionId={{id}}
      // &baseCurrencyCode={{code}}
      // &baseCurrencyAmount={{amount}}
      // &depositWalletAddress={{address}}
      // &depositWalletAddressTag={{tag}}
      const sellData = parseQueryString(route.params.queryString);

      setSaleTxid(sellData.transactionId);
      setSaleAmount(Number(sellData.amount));
      console.log(sellData);
    }
  }, [route.params.queryString]);

  return (
    <View style={styles.container}>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        {saleTxid === '' && saleAmount !== 0 ? (
          <></>
        ) : (
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
                  amount: saleAmount,
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
