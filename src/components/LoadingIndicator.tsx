import React, {useEffect, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import {BlurView} from 'expo-blur';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedProps,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Props {
  visible: boolean;
  blueBlurredBg?: boolean;
  noBlur?: boolean;
  tinted?: boolean;
  textValue?: string;
  textKey?: string;
  textDomain?: string;
}

const LoadingIndicator: React.FC<Props> = props => {
  const {
    visible,
    blueBlurredBg,
    noBlur,
    tinted,
    textValue,
    textKey,
    textDomain,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, tinted);

  // animation
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => {
    return {
      progress: progress.value,
    };
  });

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(0.18, {duration: 2000}, () => {
        progress.value = withRepeat(
          withTiming(1, {
            duration: 3000,
          }),
          -1,
          false,
        );
      });
    } else {
      progress.value = withTiming(0, {duration: 4000});
    }
  }, [progress, visible]);

  return (
    <>
      {!visible ? (
        <></>
      ) : (
        <View style={styles.container}>
          {noBlur ? null : (
            <AnimatedBlurView
              intensity={20}
              style={StyleSheet.absoluteFillObject}
              tint="default"
            />
          )}
          {!noBlur && blueBlurredBg ? <View style={styles.blurBg} /> : null}
          <View style={styles.loaderContainer}>
            <Animated.View style={styles.subContainer}>
              <AnimatedLottieView
                source={require('../assets/animations/loading.json')}
                style={{width: '100%', height: '100%'}}
                animatedProps={animatedProps}
                // autoPlay
                enableMergePathsAndroidForKitKatAndAbove={true}
              />
            </Animated.View>
          </View>
          {textKey ? (
            <TranslateText
              textKey={textKey}
              domain={textDomain || 'main'}
              maxSizeInPixels={SCREEN_HEIGHT * 0.025}
              textStyle={styles.text}
              numberOfLines={1}
            />
          ) : textValue ? (
            <TranslateText
              textValue={textValue}
              maxSizeInPixels={SCREEN_HEIGHT * 0.025}
              textStyle={styles.text}
              numberOfLines={1}
            />
          ) : null}
        </View>
      )}
    </>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  tinted?: boolean,
) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    blurBg: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#133A8A',
      opacity: 0.6,
    },
    text: {
      color: '#fff',
      fontSize: screenHeight * 0.025,
      fontWeight: 700,
      marginTop: screenHeight * 0.02,
    },
    loaderContainer: {
      height: screenHeight * 0.1,
      width: screenHeight * 0.1,
      borderRadius: screenHeight * 0.015,
      backgroundColor: '#133A8A',
      opacity: tinted ? 0.8 : 0.6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subContainer: {
      height: 150,
      width: 120,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default LoadingIndicator;
