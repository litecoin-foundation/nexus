import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isFirst?: boolean;
}

const SkeletonTransactionCell: React.FC<Props> = props => {
  const {isFirst} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isFirst || false);

  const shimmerValue = useSharedValue(0);

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

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shimmerValue]);

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Animated.View style={[styles.animatedCircle, animatedStyle]} />
      </View>
      <View style={styles.left}>
        <View style={styles.topskeleton}>
          <Animated.View style={[styles.animatedSkeleton, animatedStyle]} />
        </View>
        <View style={styles.bottomskeleton}>
          <Animated.View style={[styles.animatedSkeleton, animatedStyle]} />
        </View>
      </View>
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isFirst: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      height: 70,
      width: screenWidth,
      alignItems: 'center',
      paddingHorizontal: 19,
      borderTopWidth: isFirst ? 1 : undefined,
      borderTopColor: isFirst ? 'rgba(214, 216, 218, 0.3)' : undefined,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(214, 216, 218, 0.3)',
    },
    circle: {
      width: 32,
      height: 32,
      borderRadius: 32 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
    },
    left: {
      flexGrow: 1,
      paddingLeft: 11,
      gap: 8,
    },
    topskeleton: {
      backgroundColor: '#F4F4F4',
      width: 169,
      height: 10,
      borderRadius: 3,
      overflow: 'hidden',
    },
    bottomskeleton: {
      backgroundColor: '#F4F4F4',
      width: 94,
      height: 10,
      borderRadius: 3,
      overflow: 'hidden',
    },
    animatedCircle: {
      width: '100%',
      height: '100%',
    },
    animatedSkeleton: {
      width: '100%',
      height: '100%',
    },
  });

export default SkeletonTransactionCell;
