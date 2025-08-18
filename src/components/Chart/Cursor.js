import React, {createRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import * as array from 'd3-array';
import {Canvas, Circle, Group} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import {useDispatch} from 'react-redux';

import {
  triggerMediumFeedback,
  triggerSelectionFeedback,
} from '../../utils/haptic';
import {updateCursorValue, setCursorSelected} from '../../reducers/chart';

const Cursor = props => {
  const dispatch = useDispatch();
  const {height, width, x, y, data, children} = props;
  const panRef = createRef();
  const longPressRef = createRef();

  const [barVisible, setBarVisible] = useState(false);
  const barOffsetX = useSharedValue(0);
  const barOffsetY = useSharedValue(0);

  const transform = useDerivedValue(() => {
    return [{translateX: barOffsetX.value}, {translateY: barOffsetY.value}];
  });

  const bisectDate = array.bisector(d => d.x).left;

  const collectHovered = xPos => {
    const x0 = Math.round(xPos);
    const hoveredDate = x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    const xLeft = x(d0.x);
    const xRight = x(d1.x);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;

    dispatch(updateCursorValue(d.x, d.y));

    return {
      barOffsetX: x(d.x),
      barOffsetY: y(d.y),
    };
  };

  const onHandlerStateChange = e => {
    const {nativeEvent} = e;
    if (nativeEvent.state === State.ACTIVE) {
      const r = collectHovered(nativeEvent.x);
      runOnJS(triggerMediumFeedback)();
      runOnJS(setBarVisible)(true);
      runOnJS(() => dispatch(setCursorSelected(true)))();
      barOffsetX.value = r.barOffsetX;
      barOffsetY.value = r.barOffsetY;
    } else if (
      nativeEvent.state === State.END ||
      nativeEvent.state === State.CANCELLED
    ) {
      runOnJS(setBarVisible)(false);
      runOnJS(() => dispatch(setCursorSelected(false)))();
    }
  };

  const onPanGestureEvent = e => {
    const r = collectHovered(e.nativeEvent.x);
    if (
      barOffsetX.value === r.barOffsetX &&
      barOffsetY.value === r.barOffsetY
    ) {
      return;
    } else {
      runOnJS(triggerSelectionFeedback)();
      barOffsetX.value = r.barOffsetX;
      barOffsetY.value = r.barOffsetY;
    }
  };

  return (
    <PanGestureHandler
      onHandlerStateChange={onHandlerStateChange}
      onGestureEvent={onPanGestureEvent}
      maxPointers={1}
      minDeltaX={10}
      maxDeltaY={20}
      simultaneousHandlers={longPressRef}>
      <LongPressGestureHandler
        onHandlerStateChange={onHandlerStateChange}
        onGestureEvent={onPanGestureEvent}
        simultaneousHandlers={panRef}>
        <View style={[styles.container, {height}, {width}]} collapsable={false}>
          {children}
          <Canvas
            style={[
              {
                height,
                width,
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: barVisible ? 1 : 0,
              },
            ]}>
            <Group transform={transform}>
              <Circle cx={0} cy={0} r={6} style="fill" color="#1D67E8" />
              <Circle
                cx={0}
                cy={0}
                r={6}
                style="stroke"
                strokeWidth={4}
                color="white"
              />
            </Group>
          </Canvas>
        </View>
      </LongPressGestureHandler>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default Cursor;
