import React, {
  createRef,
  useEffect,
  useState,
  useRef,
  useContext,
  useMemo,
} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import * as shape from 'd3-shape';
import * as array from 'd3-array';
import * as scale from 'd3-scale';
import {
  Canvas,
  Circle,
  Path,
  Line,
  vec,
  Skia,
  Group,
  DashPathEffect,
  LinearGradient,
  RoundedRect,
  Text,
  matchFont,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useDerivedValue,
  useAnimatedStyle,
  runOnJS,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  LongPressGestureHandler,
} from 'react-native-gesture-handler';
import {useDispatch, useSelector} from 'react-redux';

import {monthSelector} from '../reducers/ticker';
import {walletBalanceHistorySelector} from '../reducers/transaction';
import {updateCursorValue, setCursorSelected} from '../reducers/chart';
import {triggerMediumFeedback, triggerSelectionFeedback} from '../utils/haptic';
import {ScreenSizeContext} from '../context/screenSize';

const d3 = {shape};

const lesterDown = require('../assets/images/lester-down.png');
const lesterFlat = require('../assets/images/lester-flat.png');
const lesterUp = require('../assets/images/lester-up.png');

export const GLASS_CHART_HEIGHT_RATIO = 0.15;

// Shared gap between the chart and date picker.
export const getGlassChartGap = screenHeight =>
  screenHeight < 701 ? screenHeight * 0.035 : screenHeight * 0.05;

// Shared data and scales for the drawn graph and touch overlay.
const useGlassChartScales = (width, height) => {
  const chartMode = useSelector(state => state.settings.chartMode);
  const priceData = useSelector(state => monthSelector(state));
  const balanceData = useSelector(state => walletBalanceHistorySelector(state));

  const data = chartMode === 'balance' ? balanceData || [] : priceData || [];

  return useMemo(() => {
    if (data === undefined || data.length === 0) {
      const defaultScale = scale.scaleLinear().range([0, width]).domain([0, 1]);
      return {data: [], xScale: defaultScale, yScale: defaultScale};
    }

    const yValues = data.map(item => item.y);
    const xValues = data.map(item => item.x);
    const yExtent = array.extent(yValues);
    const xExtent = array.extent(xValues);

    const xScale = scale
      .scaleTime()
      .range([0, width])
      .domain([xExtent[0], xExtent[1]]);
    const yScale = scale
      .scaleLinear()
      .range([height - 10, 10])
      .domain([yExtent[0], yExtent[1]]);

    return {data, xScale, yScale};
  }, [data, width, height]);
};

// Adds line/area paths for the drawn graph.
const useGlassChartModel = (width, height) => {
  const scales = useGlassChartScales(width, height);

  return useMemo(() => {
    const {data, xScale, yScale} = scales;
    if (data.length === 0) {
      return {...scales, line: '', area: ''};
    }

    const calcLine = d3.shape
      .line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.shape.curveBasis)(data);

    const calcArea = d3.shape
      .area()
      .x(d => xScale(d.x))
      .y0(height)
      .y1(d => yScale(d.y))
      .curve(d3.shape.curveBasis)(data);

    return {...scales, line: calcLine, area: calcArea};
  }, [scales, height]);
};

// Skia chart elements drawn by the backdrop canvas so the tab glass can
// refract the live graph.
export const useGlassChartGraphics = ({width, height, chartTop, opacity}) => {
  const model = useGlassChartModel(width, height);

  const [line, setLine] = useState({line: '', area: ''});

  const animationValue = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  useEffect(() => {
    setLine({line: model.line, area: model.area});
  }, [model.line, model.area]);

  useEffect(() => {
    animationValue.value = 0;
    gradientOpacity.value = 0;
    animationValue.value = withTiming(1, {duration: 1000});
    gradientOpacity.value = withDelay(500, withTiming(1, {duration: 500}));
  }, [line, animationValue, gradientOpacity]);

  const linePath = useMemo(() => {
    if (!line.line) {
      return null;
    }
    return Skia.Path.MakeFromSVGString(line.line);
  }, [line.line]);

  const areaPath = useMemo(() => {
    if (!line.area) {
      return null;
    }
    return Skia.Path.MakeFromSVGString(line.area);
  }, [line.area]);

  const animatedDashOffset = useDerivedValue(() => {
    return 2400 * (1 - animationValue.value);
  });

  const animatedGradientOpacity = useDerivedValue(() => {
    return gradientOpacity.value;
  });

  return useMemo(
    () => (
      <Group transform={[{translateY: chartTop}]} opacity={opacity}>
        <Line
          p1={vec(0, height * 0.15)}
          p2={vec(width, height * 0.15)}
          color="#1853B3"
          strokeWidth={1}
          opacity={0.34}
        />
        <Line
          p1={vec(0, height * 0.5)}
          p2={vec(width, height * 0.5)}
          color="#1853B3"
          strokeWidth={1}
          opacity={0.34}
        />
        <Line
          p1={vec(0, height * 0.85)}
          p2={vec(width, height * 0.85)}
          color="#1853B3"
          strokeWidth={1}
          opacity={0.34}
        />
        {areaPath && (
          <Path path={areaPath} style="fill" opacity={animatedGradientOpacity}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[
                'rgba(238, 238, 238, 0.2)',
                'rgba(238, 238, 238, 0.2)',
                'rgba(238, 238, 238, 0)',
              ]}
              positions={[0, 0.4, 1]}
            />
          </Path>
        )}
        {linePath && (
          <Path path={linePath} style="stroke" strokeWidth={3} color="white">
            <DashPathEffect
              intervals={[2400, 2400]}
              phase={animatedDashOffset}
            />
          </Path>
        )}
      </Group>
    ),
    [
      linePath,
      areaPath,
      animatedDashOffset,
      animatedGradientOpacity,
      width,
      height,
      chartTop,
      opacity,
    ],
  );
};

// Transparent gesture layer for cursor scrubbing; the graph itself is
// drawn by the backdrop canvas.
const GlassChartTouch = props => {
  const dispatch = useDispatch();
  const {triggerLester} = props;

  const {width, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = SCREEN_HEIGHT * GLASS_CHART_HEIGHT_RATIO;

  const {data, xScale: x, yScale: y} = useGlassChartScales(width, height);

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
  const steepThreshold = 3.5;

  const lastStep = useSharedValue(0);
  const nextLesterX = useSharedValue(0);
  const nextLesterY = useSharedValue(0);
  const sendLester = useSharedValue(false);
  const isLesterAnimating = useSharedValue(false);
  const lesterRotation = useSharedValue(0);
  const backflipInProccess = useSharedValue(false);
  const lesterAngleChangeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (lesterAngleChangeTimeoutRef.current) {
        clearTimeout(lesterAngleChangeTimeoutRef.current);
      }
    };
  }, []);

  const transform = useDerivedValue(() => {
    return [{translateX: barOffsetX.value}, {translateY: barOffsetY.value}];
  });

  const lesterAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: lesterX.value - 25,
      top: lesterY.value - 70,
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

    // Calculate fiat here so exchange-rate updates do not rebuild the graph.
    const yFiat = d.yFiat !== undefined ? d.yFiat : d.y * currencyRate;

    dispatch(updateCursorValue(d.x, d.y, yFiat));

    const yPosition = y(d.y);

    // Put the label below the cursor when the point is near the top edge.
    if (yPosition < 40) {
      runOnJS(setFiatLabelY)(15);
    } else {
      runOnJS(setFiatLabelY)(-35);
    }

    return {
      barOffsetX: x(d.x),
      barOffsetY: y(d.y),
    };
  };

  const updateLesterPosition = progress => {
    if (!isLesterAnimating.value) {
      return;
    }

    if (!data || data.length === 0 || !x || !y) {
      return;
    }

    sendLester.value = false;

    const exactIndex = progress * (data.length - 1);
    const index = Math.floor(exactIndex);
    const nextIndex = Math.min(index + 1, data.length - 1);
    const fraction = exactIndex - index;

    const currentPoint = data[index];
    const nextPoint = data[nextIndex];

    if (!currentPoint || !nextPoint) {
      return;
    }

    const xPos = x(currentPoint.x);
    const yPos = y(currentPoint.y);
    const nextXPos = x(nextPoint.x);
    const nextYPos = y(nextPoint.y);

    const interpolatedX = xPos + (nextXPos - xPos) * fraction;
    const interpolatedY = yPos + (nextYPos - yPos) * fraction;

    // Look ahead a few points to smooth image/angle changes.
    const lookAhead = Math.min(5, data.length - 1 - index);
    const futurePoint = data[Math.min(index + lookAhead, data.length - 1)];
    const futureYPos = y(futurePoint.y);
    const futureXPos = x(futurePoint.x);
    const slope = (futureYPos - yPos) / (futureXPos - xPos || 1);

    nextLesterX.value = interpolatedX;
    lesterTargetY.value = interpolatedY;

    nextLesterY.value = withTiming(lesterTargetY.value, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });

    if (lesterAngleChangeTimeoutRef.current) {
      clearTimeout(lesterAngleChangeTimeoutRef.current);
    }
    lesterAngleChangeTimeoutRef.current = setTimeout(
      () => {
        if (Math.abs(slope) > steepThreshold) {
          backflipInProccess.value = true;
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

  useEffect(() => {
    if (triggerLester && data && data.length > 0) {
      setLesterActive(true);
    }
  }, [triggerLester, data]);

  useEffect(() => {
    if (lesterActive) {
      isLesterAnimating.value = true;
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
            isLesterAnimating.value = false;
            sendLester.value = false;

            cancelAnimation(lesterX);
            cancelAnimation(lesterY);

            lesterOpacity.value = withTiming(0, {duration: 190}, () => {
              runOnJS(setLesterActive)(false);
            });

            lesterX.value = withDelay(200, withTiming(0, {duration: 0}));
            lesterY.value = withDelay(200, withTiming(0, {duration: 0}));
            nextLesterX.value = withDelay(200, withTiming(0, {duration: 0}));
            nextLesterY.value = withDelay(200, withTiming(0, {duration: 0}));
          }
        },
      );
    } else {
      lesterOpacity.value = 0;
    }
  }, [
    lesterActive,
    lesterProgress,
    lesterOpacity,
    lesterX,
    lesterY,
    nextLesterX,
    nextLesterY,
    sendLester,
    isLesterAnimating,
  ]);

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
      ref={panRef}
      onHandlerStateChange={onHandlerStateChange}
      onGestureEvent={onPanGestureEvent}
      maxPointers={1}
      minDeltaX={10}
      maxDeltaY={20}
      simultaneousHandlers={[longPressRef]}>
      <LongPressGestureHandler
        ref={longPressRef}
        onHandlerStateChange={onHandlerStateChange}
        onGestureEvent={onPanGestureEvent}
        simultaneousHandlers={[panRef]}>
        <View style={[styles.container, {height}, {width}]} collapsable={false}>
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
                  const rectWidth = textWidth + 16;
                  const rectX = -rectWidth / 2;
                  const textX = rectX + 8;

                  const textY = fiatLabelY + 15;

                  return (
                    <>
                      <RoundedRect
                        x={rectX}
                        y={fiatLabelY}
                        width={rectWidth}
                        height={20}
                        r={10}
                        color="rgba(255, 255, 255, 0.85)"
                      />
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default GlassChartTouch;
