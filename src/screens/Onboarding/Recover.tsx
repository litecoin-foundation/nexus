import React, {useEffect, useContext} from 'react';
import {StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import RecoveryField from '../../components/RecoveryField';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {
  setSeedRecovery,
  resetSeedAction,
  setRecoveryMode,
} from '../../reducers/onboarding';
import {useAppDispatch} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
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
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      // Only reset if going back, not when navigating forward
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        dispatch(resetSeedAction());
        dispatch(setRecoveryMode(false));
      }
    });

    return unsubscribe;
  }, [navigation, dispatch]);

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
            rightPadding
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
    <LinearGradient style={styles.gradient} colors={['#1162E6', '#0F55C7']}>
      <CustomSafeAreaView
        styles={{...styles.safeArea}}
        edges={['top', 'bottom']}>
        <RecoveryField
          handleLogin={seed => attemptLogin(seed)}
          headerText={t('enter_seed')}
          isLitewalletRecovery={false}
        />
      </CustomSafeAreaView>
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
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
  });

export const RecoverNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
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
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default Recover;
