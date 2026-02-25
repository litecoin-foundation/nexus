import React, {useContext, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

import {colors, getSpacing} from './theme';
import {ScreenSizeContext} from '../../context/screenSize';

export function SkeletonBrandCard() {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const shimmerValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue.value,
      [0, 1],
      ['rgba(244, 244, 244, 0.6)', 'rgba(200, 200, 200, 0.9)'],
    );

    return {
      backgroundColor,
    };
  });

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shimmerValue]);

  return (
    <View style={styles.brandCardContainer}>
      <View style={styles.brandCard}>
        {/* Logo skeleton */}
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoSkeleton, animatedStyle]} />
        </View>

        {/* Brand info skeleton */}
        <View style={styles.brandInfo}>
          <View style={styles.brandNameSkeleton}>
            <Animated.View style={[styles.skeletonLine, animatedStyle]} />
          </View>
          <View style={styles.brandPriceSkeleton}>
            <Animated.View style={[styles.skeletonLine, animatedStyle]} />
          </View>
        </View>

        {/* Chevron placeholder */}
        <View style={styles.chevronContainer} />
      </View>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    brandCardContainer: {
      backgroundColor: colors.white,
      borderRadius: screenHeight * 0.016,
      borderWidth: screenHeight * 0.002,
      borderColor: '#F0F0F0',
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },
    brandCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight * 0.0085,
    },
    logoContainer: {
      width: screenWidth * 0.17,
      height: screenHeight * 0.06,
      backgroundColor: colors.grayLight,
      borderRadius: screenHeight * 0.01,
      overflow: 'hidden',
    },
    logoSkeleton: {
      width: '100%',
      height: '100%',
    },
    brandInfo: {
      flex: 1,
      marginLeft: screenWidth * 0.025,
    },
    brandNameSkeleton: {
      width: '80%',
      height: screenHeight * 0.0155,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
    },
    brandPriceSkeleton: {
      width: '50%',
      height: screenHeight * 0.0135,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
      marginTop: screenHeight * 0.003,
    },
    skeletonLine: {
      width: '100%',
      height: '100%',
    },
    chevronContainer: {
      width: screenWidth * 0.1,
    },
  });
