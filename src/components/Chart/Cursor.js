import React, {createRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import * as array from 'd3-array';
import Svg, {G, Circle} from 'react-native-svg';
import {
  PanGestureHandler,
  State,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import {useDispatch} from 'react-redux';

import {
  triggerMediumFeedback,
  triggerSelectionFeedback,
} from '../../lib/utils/haptic';
import {updateCursorValue, setCursorSelected} from '../../reducers/chart';

const Cursor = props => {
  const dispatch = useDispatch();
  const {height, width, x, y, data, children} = props;
  const panRef = createRef();
  const longPressRef = createRef();

  const [barVisible, setBarVisible] = useState(false);
  const [barOffsetX, setbarOffsetX] = useState(0);
  const [barOffsetY, setbarOffsetY] = useState(0);

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
      triggerMediumFeedback();
      setBarVisible(true);
      dispatch(setCursorSelected(true));
      setbarOffsetX(r.barOffsetX);
      setbarOffsetY(r.barOffsetY);
    } else if (
      nativeEvent.state === State.END ||
      nativeEvent.state === State.CANCELLED
    ) {
      setBarVisible(false);
      dispatch(setCursorSelected(false));
    }
  };

  const onPanGestureEvent = e => {
    const r = collectHovered(e.nativeEvent.x);
    if (barOffsetX === r.barOffsetX && barOffsetY === r.barOffsetY) {
      return;
    } else {
      triggerSelectionFeedback();
      setbarOffsetX(r.barOffsetX);
      setbarOffsetY(r.barOffsetY);
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
          <Svg
            height={height}
            width={width}
            style={[styles.svg, barVisible ? styles.active : null]}>
            <G x={barOffsetX} y={barOffsetY}>
              <Circle
                cx={0}
                cy={0}
                r={5}
                stroke="white"
                strokeWidth={3}
                fill="#367be2"
              />
            </G>
          </Svg>
        </View>
      </LongPressGestureHandler>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
  active: {
    opacity: 1,
  },
});

export default Cursor;
