import React, {useEffect, useContext} from 'react';
import {View, StyleSheet, SafeAreaView, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {authenticate} from '../../lib/utils/biometric';
import {setBiometricEnabled} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StackNavigationProp} from '@react-navigation/stack';
import HeaderButton from '../../components/Buttons/HeaderButton';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type RootStackParamList = {
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Biometric'>;
}

const Biometric: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TranslateText
          textKey={'enable_biometric'}
          domain={'onboarding'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
          textStyle={styles.headerTitle}
          numberOfLines={1}
          interpolationObj={{biometricType: biometryType}}
        />
      ),
    });
  }, [navigation, biometryType]);

  return (
    <LinearGradient
      colors={['#1162E6', '#0F55C7']}
      style={[
        styles.container,
        Platform.OS === 'android' ? {marginBottom: insets.bottom} : null,
      ]}>
      <SafeAreaView />

      <Card
        titleText={biometryType}
        descTextKey="biometric_description"
        descTextDomain="onboarding"
        textInterpolation={{biometricType: biometryType}}
        imageSource={
          faceIDSupported
            ? require('../../assets/images/face-id-blue.png')
            : require('../../assets/images/touch-id-blue.png')
        }
      />

      <View style={styles.subContainer}>
        <WhiteButton
          value={`Enable ${biometryType}`}
          small={false}
          active={true}
          onPress={async () => {
            try {
              await authenticate(`Enable ${biometryType}`);
              dispatch(setBiometricEnabled(true));
              navigation.navigate('Welcome');
            } catch (error) {
              console.log(error);
              return;
            }
          }}
        />
        <WhiteClearButton
          textKey="maybe"
          textDomain="onboarding"
          small={false}
          onPress={() => {
            dispatch(setBiometricEnabled(false));
            navigation.navigate('Welcome');
          }}
        />
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subContainer: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 30,
      paddingBottom: 50,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  });

export const BiometricNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey={'enable_biometric'}
        domain={'onboarding'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.026}
        textStyle={styles.headerTitle}
        numberOfLines={1}
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

export default Biometric;
