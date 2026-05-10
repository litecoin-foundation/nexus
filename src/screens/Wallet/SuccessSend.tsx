import React, {useContext, useEffect, useRef} from 'react';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Animated, Image, StyleSheet, Text, View, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {
  satsToSubunitSelector,
  subunitCodeSelector,
} from '../../reducers/settings';
import {useAppSelector} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  SuccessSend: {
    txid: string;
    amount: number;
    toAddress: string;
  };
  SearchTransaction: undefined;
  Main: {
    isInitial: boolean;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'SuccessSend'>;
}

const SuccessSend: React.FC<Props> = ({route}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {amount, toAddress} = route.params;
  const amountCode = useAppSelector(state => subunitCodeSelector(state));
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );

  const amountInSubunit = convertToSubunit(amount);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.7,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [pulseAnim, ringScale, ringOpacity]);

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <TranslateText
            textKey="awesome"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.04}
            textStyle={styles.title}
            numberOfLines={1}
          />
          <TranslateText
            textKey="just_sent"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.subtitle}
            numberOfLines={1}
          />
          <Text style={styles.amount}>
            {amountInSubunit + ' ' + amountCode}
          </Text>
          <View style={styles.imageWrapper}>
            <Animated.View
              style={[
                styles.imageRing,
                {
                  transform: [{scale: ringScale}],
                  opacity: ringOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.imageContainer,
                {transform: [{scale: pulseAnim}]},
              ]}>
              <Image
                source={require('../../assets/images/arrow-down.png')}
                style={styles.image}
              />
            </Animated.View>
          </View>
          <View style={styles.toAddressContainer}>
            <Text style={styles.toAddressText}>{toAddress}</Text>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <CustomSafeAreaView
            styles={[styles.safeArea, styles.btnsContainer]}
            edges={Platform.OS === 'android' ? ['bottom'] : []}>
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
      fontSize: screenHeight * 0.04,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      textAlign: 'center',
      marginTop: screenHeight * 0.004,
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
      paddingHorizontal: screenWidth * 0.05,
      paddingVertical: screenWidth * 0.02,
    },
    toAddressText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
    imageWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: screenHeight * 0.022,
    },
    imageRing: {
      position: 'absolute',
      width: screenHeight * 0.04,
      height: screenHeight * 0.04,
      borderRadius: screenHeight * 0.02,
      backgroundColor: 'rgba(240, 240, 240, 0.2)',
    },
    imageContainer: {
      width: screenHeight * 0.04,
      height: screenHeight * 0.04,
      borderRadius: screenHeight * 0.02,
      backgroundColor: 'rgba(240, 240, 240, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      height: '51%',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      width: '100%',
      paddingHorizontal: screenHeight * 0.03,
    },
    btnsContainer: {
      width: '100%',
      gap: screenHeight * 0.015,
    },
    safeArea: {},
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
