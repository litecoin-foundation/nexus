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

import {ScreenSizeContext} from '../context/screenSize';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Props {
  visible: boolean;
  noBlur?: boolean;
  tinted?: boolean;
}

const LoadingIndicator: React.FC<Props> = props => {
  const {visible, noBlur, tinted} = props;

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
