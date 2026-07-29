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

// 'waiting' plays a travelling wave while LND spins up; 'outro' pops the
// boxes out before the hand-off to the Main screen.
export type UnlockPhase = 'idle' | 'waiting' | 'outro';

// Relay wave: each box rises for one step and falls during the next, so
// its neighbour starts up exactly as it peaks.
const WAVE_STEP_MS = 200;
const WAVE_LIFT = 9;
const WAVE_RAMP_MS = 400;
const OUTRO_DURATION_MS = 400;
// Per-box start delay as a fraction of the whole outro.
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

// Each box needs its own useAnimatedStyle, hence a child component.
const WaveBox: React.FC<WaveBoxProps> = props => {
  const {index, dotsLength, waveCycle, waveAmplitude, outroProgress, children} =
    props;

  // Precomputed so the worklet doesn't redo this per frame.
  const stepFraction = 1 / dotsLength;
  const boxStart = index * stepFraction;
  // Every box pops for the same slice; the stagger eats the rest.
  const outroSlice = 1 - OUTRO_STAGGER * (dotsLength - 1);
  const outroStart = index * OUTRO_STAGGER;
  const outroEnd = outroStart + outroSlice;

  const animatedStyle = useAnimatedStyle(() => {
    let cyclePos = waveCycle.value - boxStart;
    if (cyclePos < 0) {
      // The last boxes' turns wrap around the loop seam.
      cyclePos += 1;
    }
    // Raised-cosine bump across this box's two steps: up, then down
    // while the next box rises. Idle the rest of the cycle.
    let lift = 0;
    if (cyclePos < stepFraction * 2) {
      lift = 0.5 - 0.5 * Math.cos((Math.PI * cyclePos) / stepFraction);
    }
    const wave = lift * WAVE_LIFT * waveAmplitude.value;

    const t = interpolate(
      outroProgress.value,
      [outroStart, outroEnd],
      [0, 1],
      Extrapolation.CLAMP,
    );
    // Ease-out: the pop launches fast and drifts to a stop.
    const rise = 1 - (1 - t) * (1 - t);

    return {
      opacity: 1 - t,
      transform: [
        {translateY: -(wave + rise * OUTRO_RISE)},
        // Slight swell before the box shrinks away.
        {scale: 1 + OUTRO_SWELL * Math.sin(Math.PI * t) - OUTRO_SHRINK * t},
      ],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const PasscodeInput = forwardRef<PasscodeInputRef, Props>((props, ref) => {
  const {pinInactive, dotsLength, activeDotIndex, unlockPhase = 'idle'} = props;
  const dotsArray = [...Array(dotsLength)];
  const unlocking = unlockPhase !== 'idle';

  // animation
  const boxesX = useSharedValue(0);
  const waveCycle = useSharedValue(0);
  const waveAmplitude = useSharedValue(0);
  const outroProgress = useSharedValue(0);

  useEffect(() => {
    if (unlockPhase === 'waiting') {
      // Ramp in so the wave grows out of stillness.
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
      // The wave dies down while the staggered pop-out takes over.
      waveAmplitude.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
      outroProgress.value = withTiming(1, {
        duration: OUTRO_DURATION_MS,
        easing: Easing.linear,
      });
    } else {
      // Watchdog hand-back: settle the wave instead of snapping.
      cancelAnimation(waveCycle);
      waveAmplitude.value = withTiming(0, {duration: 200});
      outroProgress.value = 0;
    }
  }, [unlockPhase, dotsLength, waveCycle, waveAmplitude, outroProgress]);

  useEffect(() => {
    return () => {
      cancelAnimation(waveCycle);
    };
  }, [waveCycle]);

  const boxes = dotsArray.map((_, index) => {
    let buttonStateValue: ButtonStateType = 'inactive';

    // While unlocking every box shows the filled look (covers
    // biometrics, where nothing was typed).
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
