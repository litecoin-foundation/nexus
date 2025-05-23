import React, {useContext} from 'react';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Image, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {subunitCodeSelector} from '../../reducers/settings';
import {useAppSelector} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  SuccessConvert: {
    txid: string;
    amount: number;
    isRegular: boolean;
  };
  SearchTransaction: undefined;
  Main: {
    isInitial: boolean;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'SuccessConvert'>;
}

const SuccessConvert: React.FC<Props> = props => {
  const {route} = props;
  const {amount, isRegular} = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const amountCode = useAppSelector(state => subunitCodeSelector(state));

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <TranslateText
            textKey="awesome"
            domain="convertTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.06}
            textStyle={styles.title}
            numberOfLines={1}
          />
          <TranslateText
            textKey="just_converted"
            domain="convertTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.025}
            textStyle={styles.subtitle}
            numberOfLines={1}
          />
          <Text style={styles.amount}>{amount + ' ' + amountCode}</Text>
          <Image
            source={require('../../assets/images/arrow-down.png')}
            style={styles.image}
          />
          <View style={styles.fromToContainer}>
            <TranslateText
              textKey={isRegular ? 'regular_to_private' : 'private_to_regular'}
              domain="convertTab"
              maxSizeInPixels={SCREEN_HEIGHT * 0.04}
              textStyle={styles.fromToText}
              numberOfLines={1}
            />
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <CustomSafeAreaView
            styles={{...styles.safeArea, ...styles.btnsContainer}}
            edges={['bottom']}>
            <WhiteClearButton
              small={false}
              value="View Transaction"
              onPress={() => {
                navigation.navigate('SearchTransaction');
              }}
            />
            <WhiteButton
              disabled={false}
              small={false}
              active={true}
              value="Back to Wallet"
              onPress={() => {
                navigation.navigate('Main', {isInitial: true});
              }}
            />
          </CustomSafeAreaView>
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
      marginBottom: screenHeight * 0.03,
    },
    title: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.06,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.025,
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
      fontSize: screenHeight * 0.04,
      textAlign: 'center',
      marginTop: screenHeight * 0.005,
    },
    image: {
      height: 16,
      marginTop: 20,
      marginBottom: 20,
    },
    fromToContainer: {
      width: 'auto',
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      paddingTop: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.01,
      paddingLeft: screenHeight * 0.014,
      paddingRight: screenHeight * 0.014,
    },
    fromToText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      opacity: 0.4,
      textTransform: 'uppercase',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.02,
      width: '100%',
      paddingHorizontal: 30,
    },
    btnsContainer: {
      width: '100%',
      gap: screenHeight * 0.015,
    },
    safeArea: {},
  });

export const SuccessConvertNavigationOptions = () => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => <></>,
    gestureEnabled: false,
  };
};

export default SuccessConvert;
