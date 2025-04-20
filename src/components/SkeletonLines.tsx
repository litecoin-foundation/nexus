import React, {useContext, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  numberOfLines: number;
  lineHeight?: number;
  lineGap?: number;
  shortLastLine?: boolean;
}

const SkeletonLines: React.FC<Props> = props => {
  const {numberOfLines, lineHeight, lineGap, shortLastLine} = props;
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, lineHeight, lineGap);

  const shimmerValue = useSharedValue(0);
  const shimmerValue2 = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue.value,
      [0, 1],
      ['rgba(244, 244, 244, 0.6)', 'rgba(200, 200, 200, 0.9)'],
    );

    return {
      backgroundColor,
      transform: [
        {
          translateX: shimmerValue.value * SCREEN_WIDTH,
        },
      ],
    };
  });
  const animatedStyle2 = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue2.value,
      [0, 1],
      ['rgba(244, 244, 244, 0.6)', 'rgba(200, 200, 200, 0.9)'],
    );

    return {
      backgroundColor,
      transform: [
        {
          translateX: shimmerValue2.value * SCREEN_WIDTH * 0.7,
        },
      ],
    };
  });

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withDelay(
        500,
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
    shimmerValue2.value = withDelay(
      500,
      withRepeat(
        withDelay(
          500,
          withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [shimmerValue, shimmerValue2]);

  const fullLines = new Array(numberOfLines).fill(0).map((val, idx) => {
    return (
      <View style={styles.skeleton} key={idx}>
        <Animated.View style={[styles.animatedSkeleton, animatedStyle]} />
      </View>
    );
  });

  return (
    <View style={styles.container}>
      {fullLines}
      {shortLastLine ? (
        <View style={[styles.skeleton, styles.skeleton2]}>
          <Animated.View style={[styles.animatedSkeleton, animatedStyle2]} />
        </View>
      ) : null}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  lineHeight?: number,
  lineGap?: number,
) =>
  StyleSheet.create({
    container: {},
    skeleton: {
      width: '100%',
      height: lineHeight ? lineHeight : screenHeight * 0.022,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
      marginTop: lineGap ? lineGap : screenHeight * 0.01,
    },
    skeleton2: {
      width: '70%',
    },
    animatedSkeleton: {
      width: '100%',
      height: '100%',
    },
  });

export default SkeletonLines;
