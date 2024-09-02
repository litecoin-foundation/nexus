import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {
  Canvas,
  Circle,
  RoundedRect,
  Shadow,
  interpolateColors,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  buttonState: 'active' | 'inactive' | 'used';
}

const Box: React.FC<Props> = props => {
  const {buttonState} = props;

  // animation
  const stateChange = useSharedValue(0);
  const strokeWidth = useSharedValue(0);
  const circleRadius = useSharedValue(0);
  const yHeight = useSharedValue(7);
  const yCircleHeight = useSharedValue(35);

  const interpolatedColour = useDerivedValue(() =>
    interpolateColors(
      stateChange.value,
      [0, 50, 100],
      ['rgba(61,107,229,0.5)', '#3D6BE5', '#fefefe'],
    ),
  );

  const interpolatedStrokeColour = useDerivedValue(() =>
    interpolateColors(
      stateChange.value,
      [100, 50],
      ['rgba(216, 210, 210, 0.75)', '#ffffff'],
    ),
  );

  useEffect(() => {
    // animates used box
    stateChange.value = withTiming(buttonState === 'used' ? 100 : 50);
    if (buttonState === 'used') {
      strokeWidth.value = withTiming(1);
      circleRadius.value = withSpring(6);
      yHeight.value = withSpring(22);
      yCircleHeight.value = withSpring(35 + 7);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonState]);

  useEffect(() => {
    // animates inactive box
    if (buttonState === 'inactive') {
      stateChange.value = withTiming(buttonState === 'inactive' ? 0 : 50);
      strokeWidth.value = withTiming(2);
      circleRadius.value = withSpring(0);
      yHeight.value = withSpring(22);
      yCircleHeight.value = withSpring(35 + 7);
    }
    if (buttonState === 'active') {
      circleRadius.value = withSpring(0);
      yHeight.value = withSpring(7);
      yCircleHeight.value = withSpring(35);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonState]);

  return (
    <Canvas style={styles.container}>
      <RoundedRect
        width={40}
        height={40}
        r={10}
        color={interpolatedColour}
        x={7}
        y={yHeight}
      />
      <Shadow dx={0} dy={-1} blur={3} color="rgba(0,0,0,0.02)" inner />
      <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.08)" />
      {buttonState === 'inactive' ? null : (
        <RoundedRect
          x={7}
          y={yHeight}
          width={40}
          height={40}
          r={10}
          color={interpolatedStrokeColour}
          strokeWidth={strokeWidth}
          style="stroke"
        />
      )}
      <Circle cx={27} cy={yCircleHeight} r={circleRadius} color="#1564E7" />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 90,
    width: 53,
  },
});

export default Box;
