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

import {colors, getSpacing, getBorderRadius} from './theme';
import {ScreenSizeContext} from '../../context/screenSize';

export function SkeletonGiftCardItem() {
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
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Logo skeleton */}
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoSkeleton, animatedStyle]} />
        </View>

        {/* Card info skeleton */}
        <View style={styles.cardInfo}>
          <View style={styles.cardDateSkeleton}>
            <Animated.View style={[styles.skeletonLine, animatedStyle]} />
          </View>
          <View style={styles.cardAmountSkeleton}>
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
    cardContainer: {
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: getSpacing(screenWidth, screenHeight).md,
    },
    logoContainer: {
      width: screenWidth * 0.2,
      height: screenWidth * 0.15,
      backgroundColor: colors.grayLight,
      borderRadius: getBorderRadius(screenHeight).md,
      overflow: 'hidden',
    },
    logoSkeleton: {
      width: '100%',
      height: '100%',
    },
    cardInfo: {
      flex: 1,
      marginLeft: getSpacing(screenWidth, screenHeight).md,
    },
    cardDateSkeleton: {
      width: '50%',
      height: screenHeight * 0.014,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
    },
    cardAmountSkeleton: {
      width: '40%',
      height: screenHeight * 0.018,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
      marginTop: getSpacing(screenWidth, screenHeight).xs,
    },
    skeletonLine: {
      width: '100%',
      height: '100%',
    },
    chevronContainer: {
      width: screenWidth * 0.1,
    },
  });
