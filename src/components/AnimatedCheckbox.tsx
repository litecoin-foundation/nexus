import React, {useEffect} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

interface AnimatedCheckboxProps {
  checked: boolean;
  size?: number;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  size = 32,
}) => {
  const animatedValue = useSharedValue(checked ? 1 : 0);
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    animatedValue.value = withTiming(checked ? 1 : 0, {duration: 200});
    scaleValue.value = withSequence(
      withTiming(0.9, {duration: 100}),
      withTiming(1, {duration: 100}),
    );
  }, [checked, animatedValue, scaleValue]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        animatedValue.value,
        [0, 1],
        ['#ffffff', '#2C72FF'],
      ),
      borderColor: interpolateColor(
        animatedValue.value,
        [0, 1],
        ['#d8d8d8', '#2C72FF'],
      ),
      transform: [{scale: scaleValue.value}],
    };
  });

  const animatedTickStyle = useAnimatedStyle(() => {
    const scale = interpolate(animatedValue.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      transform: [{scale}],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        animatedContainerStyle,
      ]}>
      <Animated.View style={[styles.tickContainer, animatedTickStyle]}>
        <View style={[styles.tick, {width: size * 0.6, height: size * 0.45}]}>
          <View
            style={[
              styles.tickLine1,
              {
                width: size * 0.3,
                height: size * 0.08,
                left: size * 0.01,
                bottom: size * 0.09,
              },
            ]}
          />
          <View
            style={[
              styles.tickLine2,
              {
                width: size * 0.5,
                height: size * 0.08,
                right: size * 0.05 * -1,
                bottom: size * 0.16,
              },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

interface Styles {
  container: ViewStyle;
  tickContainer: ViewStyle;
  tick: ViewStyle;
  tickLine1: ViewStyle;
  tickLine2: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tickLine1: {
    backgroundColor: 'white',
    position: 'absolute',
    transform: [{rotate: '45deg'}],
    borderRadius: 4,
  },
  tickLine2: {
    backgroundColor: 'white',
    position: 'absolute',
    transform: [{rotate: '-45deg'}],
    borderRadius: 4,
  },
});

export default AnimatedCheckbox;
