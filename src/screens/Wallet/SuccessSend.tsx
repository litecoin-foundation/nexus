import React, {useContext} from 'react';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {Image, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
} from '../../reducers/settings';
import {useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  SuccessSend: {
    txid: string;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'SuccessSend'>;
}

const SuccessSend: React.FC<Props> = () => {
  const navigation = useNavigation();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const amount = useAppSelector(state => state.input.send.amount);
  const toAddress = useAppSelector(state => state.input.send.toAddress);
  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );

  const amountInSubunit = convertToSubunit(amount);

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <TranslateText
            textKey="awesome"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.03}
            textStyle={styles.title}
            numberOfLines={1}
          />
          <TranslateText
            textKey="sent"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.025}
            textStyle={styles.subtitle}
            numberOfLines={1}
          />
          <Text style={styles.amount}>
            {amountInSubunit + ' ' + amountCode}
          </Text>
          <Image
            source={require('../../assets/images/arrow-down.png')}
            style={styles.image}
          />
          <View style={styles.toAddressContainer}>
            <Text style={styles.toAddressText}>{toAddress}</Text>
          </View>
        </View>

        <View style={styles.confirmButtonContainer}>
          <WhiteClearButton
            small={true}
            value="View Transaction"
            onPress={() => {
              navigation.navigate('SearchTransaction');
            }}
          />
          <WhiteButton
            disabled={false}
            small={true}
            active={true}
            value="Back to Wallet"
            onPress={() => {
              navigation.navigate('Main', {isInitial: true});
            }}
          />
        </View>
      </LinearGradient>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: '100%',
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
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    amount: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.05,
      textAlign: 'center',
      marginTop: screenHeight * 0.005,
    },
    toAddressContainer: {
      width: 'auto',
      height: 'auto',
      borderRadius: screenHeight * 0.012,
      backgroundColor: 'rgba(240, 240, 240, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: screenHeight * 0.005,
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
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      width: '100%',
      height: screenHeight * 0.125,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    image: {
      height: 16,
      marginTop: 20,
      marginBottom: 20,
    },
  });

export const SuccessSendNavigationOptions = () => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => <></>,
    gestureEnabled: false,
  };
};

export default SuccessSend;
