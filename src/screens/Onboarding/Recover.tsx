import React, {useEffect, useContext} from 'react';
import {KeyboardAvoidingView, Platform, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import TranslateText from '../../components/TranslateText';
import RecoveryField from '../../components/RecoveryField';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {setSeedRecovery} from '../../reducers/onboarding';
import {useAppDispatch} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Recover'>;
}

type RootStackParamList = {
  Recover: undefined;
  Pin: undefined;
};

const debugSeed = [
  'abandon',
  'clock',
  'civil',
  'uphold',
  'february',
  'liberty',
  'tray',
  'item',
  'kiwi',
  'adult',
  'casino',
  'force',
  'check',
  'brick',
  'nerve',
  'digital',
  'lawsuit',
  'describe',
  'lecture',
  'leopard',
  'figure',
  'season',
  'unaware',
  'sick',
];

const Recover: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    if (__DEV__) {
      navigation.setOptions({
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => (
          <HeaderButton
            title="skip"
            onPress={() => {
              dispatch(setSeedRecovery(debugSeed));
              navigation.navigate('Pin');
            }}
            rightPadding={true}
          />
        ),
      });
    }
  });

  const attemptLogin = async (seed: string[]) => {
    await dispatch(setSeedRecovery(seed));
    navigation.navigate('Pin');
  };

  return (
    <LinearGradient
      colors={['#1162E6', '#0F55C7']}
      style={[
        styles.gradient,
        Platform.OS === 'android' && {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentContainer}>
            <RecoveryField
              handleLogin={seed => attemptLogin(seed)}
              headerText={t('enter_seed')}
              isLitewalletRecovery={false}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <SafeAreaView />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    // left absolute margin is screenWidth * 0.15
    // used for subtitles alinging
    headerTitle: {
      position: 'absolute',
      top: screenHeight * 0.014 * -1,
      left: screenWidth * 0.5 * -1 + screenWidth * 0.15,
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
    },
  });

export const RecoverNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitleAlign: 'center',
    headerTitle: () => (
      <TranslateText
        textKey="recover_wallet"
        domain="onboarding"
        textStyle={styles.headerTitle}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
      />
    ),
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Recover;
