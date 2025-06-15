import React, {useEffect, useContext, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {authenticate} from '../../lib/utils/biometric';
import {setBiometricEnabled} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import HeaderButton from '../../components/Buttons/HeaderButton';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Biometric'>;
}

const Biometric: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  const headerTitleMemo = useMemo(
    () => (
      <TranslateText
        textKey={'enable_biometric'}
        domain={'onboarding'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
        interpolationObj={{biometricType: biometryType}}
      />
    ),
    [SCREEN_HEIGHT, styles.headerTitle, biometryType],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => headerTitleMemo,
    });
  }, [navigation, headerTitleMemo]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.gradient}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['top', 'bottom']}>
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
      </CustomSafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: screenHeight * 0.14,
    },
    subContainer: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      gap: screenHeight * 0.02,
      paddingHorizontal: 30,
      paddingBottom: screenHeight * 0.02,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  });

export const BiometricNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
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
    headerTitleContainerStyle: {
      left: 7,
    },
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
