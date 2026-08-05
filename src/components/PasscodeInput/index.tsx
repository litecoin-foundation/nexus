import React, {forwardRef, useEffect, useImperativeHandle} from 'react';
import {StyleSheet} from 'react-native';

import Box from './Box';
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type UnlockPhase = 'idle' | 'waiting' | 'outro';

// Relay wave: each box rises for one step and falls during the next, so its
// neighbour starts moving exactly as it peaks.
const WAVE_STEP_MS = 200;
const WAVE_LIFT = 9;
const WAVE_RAMP_MS = 400;
const OUTRO_DURATION_MS = 400;
const OUTRO_STAGGER = 0.08;
const OUTRO_RISE = 26;
const OUTRO_SWELL = 0.12;
const OUTRO_SHRINK = 0.2;

interface Props {
  pinInactive: boolean;
  dotsLength: number;
  activeDotIndex: number;
  unlockPhase?: UnlockPhase;
}

export interface PasscodeInputRef {
  playIncorrectAnimation: () => void;
}

type ButtonStateType = 'active' | 'inactive' | 'used' | 'disabled';

interface WaveBoxProps {
  index: number;
  dotsLength: number;
  waveCycle: SharedValue<number>;
  waveAmplitude: SharedValue<number>;
  outroProgress: SharedValue<number>;
  children: React.ReactNode;
}

const WaveBox: React.FC<WaveBoxProps> = props => {
  const {index, dotsLength, waveCycle, waveAmplitude, outroProgress, children} =
    props;
  const stepFraction = 1 / dotsLength;
  const boxStart = index * stepFraction;
  const outroSlice = 1 - OUTRO_STAGGER * (dotsLength - 1);
  const outroStart = index * OUTRO_STAGGER;
  const outroEnd = outroStart + outroSlice;

  const animatedStyle = useAnimatedStyle(() => {
    let cyclePosition = waveCycle.value - boxStart;
    if (cyclePosition < 0) {
      cyclePosition += 1;
    }

    let lift = 0;
    if (cyclePosition < stepFraction * 2) {
      lift = 0.5 - 0.5 * Math.cos((Math.PI * cyclePosition) / stepFraction);
    }
    const wave = lift * WAVE_LIFT * waveAmplitude.value;

    const progress = interpolate(
      outroProgress.value,
      [outroStart, outroEnd],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const rise = 1 - (1 - progress) * (1 - progress);

    return {
      opacity: 1 - progress,
      transform: [
        {translateY: -(wave + rise * OUTRO_RISE)},
        {
          scale:
            1 +
            OUTRO_SWELL * Math.sin(Math.PI * progress) -
            OUTRO_SHRINK * progress,
        },
      ],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const PasscodeInput = forwardRef<PasscodeInputRef, Props>((props, ref) => {
  const {pinInactive, dotsLength, activeDotIndex, unlockPhase = 'idle'} = props;
  const dotsArray = [...Array(dotsLength)];
  const unlocking = unlockPhase !== 'idle';

  const boxesX = useSharedValue(0);
  const waveCycle = useSharedValue(0);
  const waveAmplitude = useSharedValue(0);
  const outroProgress = useSharedValue(0);

  useEffect(() => {
    if (unlockPhase === 'waiting') {
      waveAmplitude.value = withTiming(1, {
        duration: WAVE_RAMP_MS,
        easing: Easing.out(Easing.quad),
      });
      waveCycle.value = 0;
      waveCycle.value = withRepeat(
        withTiming(1, {
          duration: WAVE_STEP_MS * dotsLength,
          easing: Easing.linear,
        }),
        -1,
      );
    } else if (unlockPhase === 'outro') {
      waveAmplitude.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
      outroProgress.value = withTiming(1, {
        duration: OUTRO_DURATION_MS,
        easing: Easing.linear,
      });
    } else {
      cancelAnimation(waveCycle);
      waveAmplitude.value = withTiming(0, {duration: 200});
      outroProgress.value = 0;
    }
  }, [unlockPhase, dotsLength, waveCycle, waveAmplitude, outroProgress]);

  useEffect(() => {
    return () => cancelAnimation(waveCycle);
  }, [waveCycle]);

  const boxes = dotsArray.map((_, index) => {
    let buttonStateValue: ButtonStateType = 'inactive';

    // Biometrics do not populate the input, so show every box as filled while
    // either unlock animation phase is active.
    if (unlocking) {
      buttonStateValue = 'used';
    } else if (pinInactive) {
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

    return (
      <WaveBox
        key={index}
        index={index}
        dotsLength={dotsLength}
        waveCycle={waveCycle}
        waveAmplitude={waveAmplitude}
        outroProgress={outroProgress}>
        <Box buttonState={buttonStateValue} />
      </WaveBox>
    );
  });

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
