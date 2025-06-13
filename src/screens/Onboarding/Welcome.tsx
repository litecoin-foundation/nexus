import React, {useEffect, useContext, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import ProgressBar from '../../components/ProgressBar';
import LoadingIndicator from '../../components/LoadingIndicator';
import TranslateText from '../../components/TranslateText';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {initWallet, startLnd} from '../../reducers/lightning';
import {setSeed, skipPresync} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../lib/utils/poll';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Welcome: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
}

const Welcome: React.FC<Props> = props => {
  const {navigation} = props;

  const {t} = useTranslation('onboarding');

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);

  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  const {task, isOnboarded, downloadProgress, unzipProgress} = useAppSelector(
    state => state.onboarding,
  );
  const {lndActive} = useAppSelector(state => state.lightning);

  // calls initWallet() when LND has started!
  useEffect(() => {
    if (lndActive === true) {
      // TODO
      // ATM we sleep for 1500ms to make sure LND returns valid subscribeState
      // values. This should hopefully be fixed in the future.
      sleep(1500).then(() => {
        dispatch(initWallet());
      });
    }
  }, [dispatch, lndActive]);

  // when finishOnboarding() is called isOnboarded is true
  // we know to navigate user to the wallet
  useEffect(() => {
    if (isOnboarded === true) {
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'NewWalletStack'}],
      });
    }
  }, [isOnboarded, navigation]);

  // startup wallet after presyncing is over!
  useEffect(() => {
    if (task === 'complete' || task === 'failed') {
      setLoading(true);
      dispatch(setSeed());
      dispatch(startLnd());
    }
  }, [dispatch, task]);

  const handleSkipPresync = () => {
    dispatch(skipPresync());
  };

  // show skip button after 20 seconds during presyncing
  useEffect(() => {
    if (task === 'downloading' || task === 'unzipping') {
      const timer = setTimeout(() => {
        setShowSkipButton(true);
        buttonOpacity.value = withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
        buttonTranslateY.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
      }, 20000); // 20 seconds

      return () => clearTimeout(timer);
    } else {
      setShowSkipButton(false);
      buttonOpacity.value = 0;
      buttonTranslateY.value = 20;
    }
  }, [task, buttonOpacity, buttonTranslateY]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [
        {
          translateY: buttonTranslateY.value,
        },
      ],
    };
  });

  const cacheProgress = (
    <View style={styles.neutrinoCacheContainer}>
      <View style={styles.titleContainer}>
        <TranslateText
          textKey="presync"
          domain="onboarding"
          textStyle={styles.titleText}
        />

        <TranslateText
          textKey="presync_description"
          domain="onboarding"
          textStyle={styles.descriptionText}
        />
      </View>

      <View style={styles.progressBarContainer}>
        {task === 'downloading' ? (
          <ProgressBar percentageProgress={downloadProgress! * 100} />
        ) : (
          <ProgressBar percentageProgress={unzipProgress! * 100} />
        )}
      </View>
      <Text style={styles.descriptionText}>{task}</Text>
    </View>
  );

  return (
    <>
      <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.contentContainer}>
            {task !== 'complete' ? cacheProgress : null}
          </View>

          {showSkipButton && (
            <Animated.View
              style={[styles.buttonContainer, animatedButtonStyle]}>
              <WhiteClearButton
                textKey="skip_presync"
                textDomain="onboarding"
                small={false}
                onPress={() => {
                  Alert.alert(
                    t('are_you_sure'),
                    t('skip_presync_description'),
                    [
                      {
                        text: t('cancel'),
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {text: t('ok'), onPress: () => handleSkipPresync()},
                    ],
                  );
                }}
              />
            </Animated.View>
          )}
        </CustomSafeAreaView>
      </LinearGradient>

      <LoadingIndicator visible={loading} />
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    safeArea: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    contentContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 30,
      paddingBottom: screenHeight * 0.02,
    },
    neutrinoCacheContainer: {
      alignSelf: 'center',
      height: screenHeight * 0.225,
      width: screenWidth - 60,
      borderRadius: screenHeight * 0.02,
      backgroundColor: 'white',
      shadowColor: 'rgb(82,84,103);',
      shadowOpacity: 0.12,
      shadowRadius: screenHeight * 0.015,
      elevation: screenHeight * 0.015,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      alignItems: 'center',
    },
    progressBarContainer: {
      width: (screenWidth - 60) * 0.8,
      minWidth: (screenWidth - 60) * 0.8,
      paddingHorizontal: screenHeight * 0.01,
      paddingVertical: screenHeight * 0.015,
    },
    titleContainer: {
      paddingLeft: screenHeight * 0.025,
      paddingRight: screenHeight * 0.025,
      paddingTop: screenHeight * 0.025,
    },
    titleText: {
      textAlign: 'center',
      color: '#2C72FF',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.03,
      fontWeight: 'bold',
      paddingBottom: screenHeight * 0.025,
    },
    descriptionText: {
      textAlign: 'center',
      color: '#4A4A4A',
      fontSize: screenHeight * 0.017,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const WelcomeNavigationOptions = (): StackNavigationOptions => {
  return {
    headerTitle: () => null,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => null,
    gestureEnabled: false,
  };
};

export default Welcome;
