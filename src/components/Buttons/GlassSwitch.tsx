import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Glass from '../Wrappers/Glass';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

const SPRING = {damping: 18, stiffness: 260, mass: 0.6};

interface Props {
  onPress?: (bool: boolean) => void;
  initialValue?: boolean;
  fakeSwitch?: boolean;
  scheme?: 'light' | 'dark';
}

const GlassSwitch: React.FC<Props> = props => {
  const {onPress, initialValue, fakeSwitch, scheme = 'dark'} = props;
  const value = !!initialValue;
  const [triggered, trigger] = useState(value);
  const progress = useSharedValue(value ? 1 : 0);

  const thumbOff = scheme === 'light' ? '#C2C2C2' : 'rgba(255,255,255,0.6)';

  // Follow the parent when it drives the value — a rejected write reverting the
  // setting has to pull the thumb back. Keyed off the previous prop rather than
  // off `triggered`, so an optimistic local toggle isn't undone before the
  // parent has caught up.
  const previousValue = useRef(value);
  useEffect(() => {
    if (value === previousValue.current) {
      return;
    }
    previousValue.current = value;
    trigger(value);
    progress.value = withSpring(value ? 1 : 0, SPRING);
  }, [value, progress]);

  const handlePress = () => {
    const next = !triggered;
    if (!fakeSwitch) {
      trigger(next);
      progress.value = withSpring(next ? 1 : 0, SPRING);
    }
    onPress?.(next);
  };

  const animatedAccent = useAnimatedStyle(() => ({opacity: progress.value}));

  const animatedThumb = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * THUMB_TRAVEL}],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [thumbOff, '#ffffff'],
    ),
  }));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{checked: triggered}}
      style={({pressed}) => (pressed ? styles.pressed : null)}>
      <Glass
        radius={TRACK_HEIGHT / 2}
        intensity={22}
        scheme={scheme}
        style={styles.track}>
        <Animated.View
          pointerEvents="none"
          style={[styles.accent, animatedAccent]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, animatedThumb]}
        />
      </Glass>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    padding: THUMB_INSET,
    justifyContent: 'center',
  },
  accent: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TRACK_HEIGHT / 2,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(44,114,255,0.62)',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
    boxShadow: [
      {offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.3)'},
      {
        offsetX: 0,
        offsetY: 1,
        blurRadius: 0,
        color: 'rgba(255,255,255,0.45)',
        inset: true,
      },
    ],
  },
  pressed: {
    opacity: 0.85,
  },
});

export default GlassSwitch;
