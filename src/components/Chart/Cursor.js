import React, {createRef, useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import * as array from 'd3-array';
import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Text,
  matchFont,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import {useDispatch, useSelector} from 'react-redux';

import {
  triggerMediumFeedback,
  triggerSelectionFeedback,
} from '../../utils/haptic';
import {updateCursorValue, setCursorSelected} from '../../reducers/chart';

const lesterDown = require('../../assets/images/lester-down.png');
const lesterFlat = require('../../assets/images/lester-flat.png');
const lesterUp = require('../../assets/images/lester-up.png');

const Cursor = props => {
  const dispatch = useDispatch();
  const {height, width, x, y, data, children} = props;

  const chartMode = useSelector(state => state.settings.chartMode);
  const cursorValueFiat = useSelector(state => state.chart.cursorValueFiat);
  const currencySymbol = useSelector(state => state.settings.currencySymbol);
  const currencyRate = useSelector(state => {
    const rates = state.ticker.rates;
    const currencyCode = state.settings.currencyCode;
    return rates[currencyCode] || 0;
  });
  const panRef = createRef();
  const longPressRef = createRef();
  const easterEggRef = createRef();

  const [barVisible, setBarVisible] = useState(false);
  const [lesterActive, setLesterActive] = useState(false);
  const [lesterImage, setLesterImage] = useState(lesterFlat);

  const barOffsetX = useSharedValue(0);
  const barOffsetY = useSharedValue(0);
  const [fiatLabelY, setFiatLabelY] = useState(-35);

  const fontFamily = Platform.select({
    ios: 'Satoshi Variable',
    default: 'Satoshi',
  });
  const fontStyle = {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
  };
  const font = matchFont(fontStyle);
  const lesterProgress = useSharedValue(0);
  const lesterX = useSharedValue(0);
  const lesterY = useSharedValue(0);
  const lesterTargetY = useSharedValue(0);
  const lesterOpacity = useSharedValue(0);

  const lesterFrames = 50;
  const lesterDuration = 3000;
  const threshold = 0.15;
  const steepThreshold = 3.5; // Ratio Y to X in pixels for when backflip triggers

  const lastStep = useSharedValue(0);
  const nextLesterX = useSharedValue(0);
  const nextLesterY = useSharedValue(0);
  const sendLester = useSharedValue(false);
  const lesterRotation = useSharedValue(0);
  const backflipInProccess = useSharedValue(false);
  const lesterAngleChangeTimeoutRef = useRef(null);
  const lesterFinishedTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (lesterAngleChangeTimeoutRef.current) {
        clearTimeout(lesterAngleChangeTimeoutRef.current);
      }
      if (lesterFinishedTimeoutRef.current) {
        clearTimeout(lesterFinishedTimeoutRef.current);
      }
    };
  }, []);

  const transform = useDerivedValue(() => {
    return [{translateX: barOffsetX.value}, {translateY: barOffsetY.value}];
  });

  const lesterAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: lesterX.value - 25, // Center horizontally (assuming 50px width)
      top: lesterY.value - 70, // Bottom of image touches the line (assuming 50px height)
      width: 70,
      height: 70,
      opacity: lesterOpacity.value,
      transform: [{rotate: `${lesterRotation.value}deg`}],
    };
  });

  const bisectDate = array.bisector(d => d.x).left;

  const collectHovered = xPos => {
    if (!data || data.length === 0 || !x || !y) {
      return {barOffsetX: 0, barOffsetY: 0};
    }

    const x0 = Math.round(xPos);
    const hoveredDate = x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;

    if (!d0 || !d1) {
      return {barOffsetX: 0, barOffsetY: 0};
    }

    const xLeft = x(d0.x);
    const xRight = x(d1.x);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;

    // Calculate fiat value on-the-fly for balance mode
    // This prevents chart recalculation when exchange rates update
    const yFiat = d.yFiat !== undefined ? d.yFiat : d.y * currencyRate;

    dispatch(updateCursorValue(d.x, d.y, yFiat));

    const yPosition = y(d.y);

    // Position fiat label above cursor if there's room, otherwise below
    // If cursor is within 40px of top, show label below cursor
    if (yPosition < 40) {
      runOnJS(setFiatLabelY)(15); // Below cursor
    } else {
      runOnJS(setFiatLabelY)(-35); // Above cursor (default)
    }

    return {
      barOffsetX: x(d.x),
      barOffsetY: y(d.y),
    };
  };

  const updateLesterPosition = progress => {
    if (!data || data.length === 0 || !x || !y) {
      return;
    }

    sendLester.value = false;

    // Calculate the index based on progress (0 to 1)
    const exactIndex = progress * (data.length - 1);
    const index = Math.floor(exactIndex);
    const nextIndex = Math.min(index + 1, data.length - 1);
    const fraction = exactIndex - index; // Fractional part for interpolation

    const currentPoint = data[index];
    const nextPoint = data[nextIndex];

    if (!currentPoint || !nextPoint) return;

    // Get the x, y coordinates using the scale functions
    const xPos = x(currentPoint.x);
    const yPos = y(currentPoint.y);
    const nextXPos = x(nextPoint.x);
    const nextYPos = y(nextPoint.y);

    // Interpolate between current and next point for smoother movement
    const interpolatedX = xPos + (nextXPos - xPos) * fraction;
    const interpolatedY = yPos + (nextYPos - yPos) * fraction;

    // Calculate slope for image selection using a wider range for smoother transitions
    const lookAhead = Math.min(5, data.length - 1 - index);
    const futurePoint = data[Math.min(index + lookAhead, data.length - 1)];
    const futureYPos = y(futurePoint.y);
    const futureXPos = x(futurePoint.x);
    const slope = (futureYPos - yPos) / (futureXPos - xPos || 1);

    // Update shared values
    nextLesterX.value = interpolatedX;
    lesterTargetY.value = interpolatedY;

    // Smooth Y position with spring-like dampening
    nextLesterY.value = withTiming(lesterTargetY.value, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });

    // Tilt Lester
    if (lesterAngleChangeTimeoutRef.current) {
      clearTimeout(lesterAngleChangeTimeoutRef.current);
    }
    lesterAngleChangeTimeoutRef.current = setTimeout(
      () => {
        if (Math.abs(slope) > steepThreshold) {
          // Backflip
          backflipInProccess.value = true;
          // Jump Lester in the air to land a proper backflip
          nextLesterY.value = nextLesterY.value - 20;
          lesterRotation.value = withTiming(
            -360,
            {
              duration: 400,
              easing: Easing.out(Easing.ease),
            },
            finished => {
              if (finished) {
                lesterRotation.value = 0;
                backflipInProccess.value = false;
              }
            },
          );
        } else if (slope < -threshold) {
          setLesterImage(lesterUp);
        } else if (slope > threshold) {
          setLesterImage(lesterDown);
        } else {
          setLesterImage(lesterFlat);
        }
      },
      lesterDuration / lesterFrames / 2,
    );

    if (!backflipInProccess.value) {
      const rotationAngle = (Math.atan(slope) * (180 / Math.PI)) / 2;
      lesterRotation.value = withTiming(rotationAngle, {
        duration: lesterDuration / lesterFrames,
        easing: Easing.out(Easing.ease),
      });
    }

    sendLester.value = true;
    sendLesterToNextPoint();
  };

  const sendLesterToNextPoint = () => {
    if (sendLester.value) {
      lesterX.value = withTiming(nextLesterX.value, {
        duration: lesterDuration / lesterFrames,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
      lesterY.value = withTiming(nextLesterY.value, {
        duration: lesterDuration / lesterFrames,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
    }
  };

  useDerivedValue(() => {
    const currentStep = Math.floor(lesterProgress.value / (1 / lesterFrames));
    if (currentStep !== lastStep.value) {
      lastStep.value = currentStep;
      runOnJS(updateLesterPosition)(currentStep * (1 / lesterFrames));
    }
  });

  // Trigger animation when easter egg is activated
  useEffect(() => {
    if (lesterActive) {
      lesterProgress.value = 0;
      lesterOpacity.value = 1;
      lesterProgress.value = withTiming(
        1,
        {
          duration: lesterDuration,
          easing: Easing.linear,
        },
        finished => {
          if (finished) {
            lesterOpacity.value = withTiming(0, {duration: 200});

            // Wait for animation to finish
            if (lesterFinishedTimeoutRef.current) {
              clearTimeout(lesterFinishedTimeoutRef.current);
            }
            lesterFinishedTimeoutRef.current = setTimeout(() => {
              lesterX.value = 0;
              lesterY.value = 0;
              nextLesterX.value = 0;
              nextLesterY.value = 0;
              runOnJS(setLesterActive)(false);
            }, 200);
          }
        },
      );
    } else {
      lesterOpacity.value = 0;
    }
  }, [lesterActive]);

  const onEasterEggHandlerStateChange = e => {
    const {nativeEvent} = e;
    if (nativeEvent.state === State.ACTIVE && data && data.length > 0) {
      runOnJS(triggerMediumFeedback)();
      runOnJS(setLesterActive)(true);
    }
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
    <LongPressGestureHandler
      ref={easterEggRef}
      onHandlerStateChange={onEasterEggHandlerStateChange}
      minDurationMs={3000}
      maxDist={10000}
      simultaneousHandlers={[panRef, longPressRef]}>
      <PanGestureHandler
        ref={panRef}
        onHandlerStateChange={onHandlerStateChange}
        onGestureEvent={onPanGestureEvent}
        maxPointers={1}
        minDeltaX={10}
        maxDeltaY={20}
        simultaneousHandlers={[longPressRef, easterEggRef]}>
        <LongPressGestureHandler
          ref={longPressRef}
          onHandlerStateChange={onHandlerStateChange}
          onGestureEvent={onPanGestureEvent}
          simultaneousHandlers={[panRef, easterEggRef]}>
          <View
            style={[styles.container, {height}, {width}]}
            collapsable={false}>
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
                {chartMode === 'balance' &&
                  cursorValueFiat !== undefined &&
                  (() => {
                    const fiatText = `${currencySymbol}${cursorValueFiat.toFixed(2)}`;
                    const textWidth = font
                      ? font.measureText(fiatText).width
                      : 40;
                    const rectWidth = textWidth + 16; // Add padding
                    const rectX = -rectWidth / 2;
                    const textX = rectX + 8; // Left padding

                    // Dynamic text Y position based on where the rectangle is
                    const textY = fiatLabelY + 15; // 15px from top of rectangle

                    return (
                      <>
                        {/* Rounded rectangle for fiat value */}
                        <RoundedRect
                          x={rectX}
                          y={fiatLabelY}
                          width={rectWidth}
                          height={20}
                          r={10}
                          color="rgba(255, 255, 255, 0.85)"
                        />
                        {/* Fiat value text */}
                        <Text
                          x={textX}
                          y={textY}
                          text={fiatText}
                          font={font}
                          color="rgb(29, 103, 232)"
                        />
                      </>
                    );
                  })()}
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
            <Animated.Image
              source={lesterImage}
              style={lesterAnimatedStyle}
              resizeMode="contain"
              pointerEvents="none"
            />
          </View>
        </LongPressGestureHandler>
      </PanGestureHandler>
    </LongPressGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default Cursor;
