import React, {forwardRef, useImperativeHandle} from 'react';
import {StyleSheet} from 'react-native';

import Box from './Box';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  pinInactive: boolean;
  dotsLength: number;
  activeDotIndex: number;
}

interface PasscodeInputRef {
  playIncorrectAnimation: () => void;
}

type ButtonStateType = 'active' | 'inactive' | 'used' | 'disabled';

const PasscodeInput = forwardRef<PasscodeInputRef, Props>((props, ref) => {
  const {pinInactive, dotsLength, activeDotIndex} = props;
  const dotsArray = [...Array(dotsLength)];

  const boxes = dotsArray.map((_, index) => {
    let buttonStateValue: ButtonStateType = 'inactive';

    if (pinInactive) {
      buttonStateValue = 'disabled';
    } else {
      if (activeDotIndex < index) {
        buttonStateValue = 'inactive';
      } else if (activeDotIndex === index) {
        buttonStateValue = 'active';
      } else if (activeDotIndex > index) {
        buttonStateValue = 'used';
      }
    }

    return <Box buttonState={buttonStateValue} key={index} />;
  });

  // animation
  const boxesX = useSharedValue(0);

  const incorrectPinMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: boxesX.value}],
    };
  });

  useImperativeHandle(ref, () => ({
    playIncorrectAnimation() {
      boxesX.value = withRepeat(
        withSequence(
          withTiming(-10, {duration: 100}),
          withTiming(10, {duration: 100}),
        ),
        3,
        true,
      );
    },
  }));

  return (
    <Animated.View style={[styles.container, incorrectPinMotionStyle]}>
      {boxes}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
});

export default PasscodeInput;
