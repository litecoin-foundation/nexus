import React, {useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
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

const screenHeight = Dimensions.get('screen').height;
const screenWidth = Dimensions.get('screen').width;
const width = screenWidth * 0.106;

interface Props {
  buttonState: 'active' | 'inactive' | 'used' | 'disabled';
}

const Box: React.FC<Props> = props => {
  const {buttonState} = props;

  // animation
  const stateChange = useSharedValue(0);
  const strokeWidth = useSharedValue(0);
  const circleRadius = useSharedValue(0);
  const yHeight = useSharedValue(7);
  const yCircleHeight = useSharedValue(width - 7);

  const opacityStyle = {
    opacity: buttonState === 'disabled' ? 0.2 : 1,
  };

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
      yCircleHeight.value = withSpring(width);
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
      yCircleHeight.value = withSpring(width);
    }
    if (buttonState === 'active') {
      circleRadius.value = withSpring(0);
      yHeight.value = withSpring(7);
      yCircleHeight.value = withSpring(width - 7);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonState]);

  return (
    <Canvas style={[styles.container, opacityStyle]}>
      <RoundedRect
        width={width}
        height={width}
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
          width={width}
          height={width}
          r={10}
          color={interpolatedStrokeColour}
          strokeWidth={strokeWidth}
          style="stroke"
        />
      )}
      <Circle
        cx={width / 2 + 7}
        cy={yCircleHeight}
        r={circleRadius}
        color="#1564E7"
      />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 470 / screenHeight > 0.51 ? 70 : 90,
    width: width + 12,
  },
});

export default Box;
