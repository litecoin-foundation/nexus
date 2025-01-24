import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
// import {Skottie, SkottieAPI} from 'react-native-skottie';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedProps,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const Loading = () => {
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => {
    return {
      progress: progress.value,
    };
  });

  useEffect(() => {
    progress.value = withTiming(0.18, {duration: 2000}, () => {
      progress.value = withRepeat(
        withTiming(1, {
          duration: 3000,
        }),
        -1,
        true,
      );
    });
  }, []);

  return (
    <Animated.View style={styles.container}>
      <AnimatedLottieView
        source={require('../assets/animations/loading.json')}
        style={{width: '100%', height: '100%'}}
        animatedProps={animatedProps}
        autoPlay
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 500,
    width: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loading;
