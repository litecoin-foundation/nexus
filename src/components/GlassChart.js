import React, {
  useCallback,
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
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useDispatch, useSelector} from 'react-redux';

import {
  cursorLut,
  cursorActive,
  cursorCol,
  cursorIdx,
  cursorX,
  cursorY,
  resetCursor,
  EMPTY_LUT,
} from './glassChartCursor';
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

// matchFont re-invokes Skia.FontMgr.System() on every call, so resolve once.
let PILL_FONT = null;
const getPillFont = () =>
  (PILL_FONT ??= matchFont({
    fontFamily: Platform.select({ios: 'Satoshi Variable', default: 'Satoshi'}),
    fontSize: 12,
    fontWeight: '700',
  }));

// Transparent gesture layer for cursor scrubbing; the graph itself is
// drawn by the backdrop canvas.
// The cursor is drawn by LiquidGlassBackdrop's canvas rather than one of its
// own: every extra <Canvas> costs a per-frame setJsiProperty hand-off on the UI
// thread whatever it draws, and mounting one per fold also builds a fresh
// TextureView. chartTop puts it in backdrop coords, matching
// useGlassChartGraphics.
export const useGlassChartCursorGraphics = ({chartTop}) => {
  const chartMode = useSelector(state => state.settings.chartMode);
  const font = getPillFont();

  const transform = useDerivedValue(() => [
    {translateX: cursorX.value},
    {translateY: chartTop + cursorY.value},
  ]);
  // Cursor props are shared values, so a scrub never re-records the tree.
  const cursorOpacity = useDerivedValue(() => cursorActive.value);
  const pillText = useDerivedValue(() => {
    const lut = cursorLut.value;
    const c = cursorCol.value;
    return c < 0 || c >= lut.cols ? '' : lut.pill[c];
  });
  const pillWidth = useDerivedValue(() => {
    const lut = cursorLut.value;
    const c = cursorCol.value;
    return (c < 0 || c >= lut.cols ? 40 : lut.pillW[c]) + 16;
  });
  const pillX = useDerivedValue(() => -pillWidth.value / 2);
  const pillTextX = useDerivedValue(() => pillX.value + 8);
  // Put the label below the cursor when the point is near the top edge.
  const pillY = useDerivedValue(() => (cursorY.value < 40 ? 15 : -35));
  const pillTextY = useDerivedValue(() => pillY.value + 15);

  return (
    <Group transform={transform} opacity={cursorOpacity}>
      {chartMode === 'balance' && (
        <>
          <RoundedRect
            x={pillX}
            y={pillY}
            width={pillWidth}
            height={20}
            r={10}
            color="rgba(255, 255, 255, 0.85)"
          />
          <Text
            x={pillTextX}
            y={pillTextY}
            text={pillText}
            font={font}
            color="rgb(29, 103, 232)"
          />
        </>
      )}
      <Circle cx={0} cy={0} r={6} style="fill" color="#1D67E8" />
      <Circle cx={0} cy={0} r={6} style="stroke" strokeWidth={4} color="white" />
    </Group>
  );
};

const GlassChartTouch = props => {
  const dispatch = useDispatch();
  const {triggerLester} = props;

  const {width, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = SCREEN_HEIGHT * GLASS_CHART_HEIGHT_RATIO;

  const {data, xScale: x, yScale: y} = useGlassChartScales(width, height);

  const currencySymbol = useSelector(state => state.settings.currencySymbol);
  const currencyRate = useSelector(state => {
    const rates = state.ticker.rates;
    const currencyCode = state.settings.currencyCode;
    return rates[currencyCode] || 0;
  });

  const [lesterActive, setLesterActive] = useState(false);
  const [lesterImage, setLesterImage] = useState(lesterFlat);

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

  // Everything the scrub needs, resolved once per data change so the gesture
  // worklet is a single array lookup.
  useEffect(() => {
    const pillFont = getPillFont();
    if (!data || data.length === 0 || !x || !y || !pillFont) {
      cursorLut.value = EMPTY_LUT;
      return;
    }
    const bisectDate = array.bisector(d => d.x).left;
    const cols = Math.max(1, Math.round(width) + 1);
    const cx = new Float32Array(cols);
    const cy = new Float32Array(cols);
    const idx = new Int32Array(cols);
    const pill = new Array(cols);
    const pillW = new Float32Array(cols);

    for (let c = 0; c < cols; c++) {
      const i = bisectDate(data, x.invert(c), 1);
      const lo = i - 1;
      const hi = data[i] ? i : i - 1;
      const d0 = data[lo];
      const d1 = data[hi];
      if (!d0 || !d1) {
        cx[c] = 0;
        cy[c] = 0;
        idx[c] = -1;
        pill[c] = '';
        pillW[c] = 40;
        continue;
      }
      // Same nearest-point tie-break the old collectHovered used.
      const di = Math.abs(c - x(d0.x)) < Math.abs(c - x(d1.x)) ? lo : hi;
      const d = data[di];
      const yFiat = d.yFiat !== undefined ? d.yFiat : d.y * currencyRate;
      cx[c] = x(d.x);
      cy[c] = y(d.y);
      idx[c] = di;
      const label = `${currencySymbol}${yFiat.toFixed(2)}`;
      pill[c] = label;
      pillW[c] = pillFont.measureText(label).width;
    }
    cursorLut.value = {cols, cx, cy, idx, pill, pillW};
  }, [data, x, y, width, currencySymbol, currencyRate]);

  useEffect(() => () => resetCursor(), []);

  // The readout is Paragraph text in the backdrop canvas, so it only changes
  // on a React render; push it at ~12Hz instead of per touch move.
  const dataRef = useRef(data);
  dataRef.current = data;
  const rateRef = useRef(currencyRate);
  rateRef.current = currencyRate;
  const lastPushRef = useRef(0);

  const pushCursor = useCallback(
    (di, force) => {
      const d = dataRef.current?.[di];
      if (!d) {
        return;
      }
      const now = Date.now();
      if (!force && now - lastPushRef.current < 80) {
        return;
      }
      lastPushRef.current = now;
      const yFiat = d.yFiat !== undefined ? d.yFiat : d.y * rateRef.current;
      dispatch(updateCursorValue(d.x, d.y, yFiat));
    },
    [dispatch],
  );

  const setSelected = useCallback(
    v => dispatch(setCursorSelected(v)),
    [dispatch],
  );

  const panOn = useSharedValue(false);
  const holdOn = useSharedValue(false);

  const resolve = useCallback(
    px => {
      'worklet';
      const lut = cursorLut.value;
      if (lut.cols === 0) {
        return;
      }
      const c = Math.min(lut.cols - 1, Math.max(0, Math.round(px)));
      if (c === cursorCol.value) {
        return;
      }
      cursorCol.value = c;
      cursorX.value = lut.cx[c];
      cursorY.value = lut.cy[c];
      if (lut.idx[c] !== cursorIdx.value) {
        cursorIdx.value = lut.idx[c];
        runOnJS(triggerSelectionFeedback)();
        runOnJS(pushCursor)(lut.idx[c], false);
      }
    },
    [pushCursor],
  );

  const begin = useCallback(
    (which, px) => {
      'worklet';
      const wasActive = panOn.value || holdOn.value;
      if (which === 0) {
        panOn.value = true;
      } else {
        holdOn.value = true;
      }
      if (wasActive) {
        resolve(px);
        return;
      }
      cursorCol.value = -1;
      cursorIdx.value = -1;
      resolve(px);
      cursorActive.value = 1;
      runOnJS(triggerMediumFeedback)();
      runOnJS(setSelected)(true);
    },
    [panOn, holdOn, resolve, setSelected],
  );

  const end = useCallback(
    which => {
      'worklet';
      if (which === 0) {
        panOn.value = false;
      } else {
        holdOn.value = false;
      }
      if (panOn.value || holdOn.value) {
        return;
      }
      if (cursorActive.value === 0) {
        return;
      }
      cursorActive.value = 0;
      runOnJS(setSelected)(false);
    },
    [panOn, holdOn, setSelected],
  );

  const gesture = useMemo(
    () =>
      Gesture.Simultaneous(
        Gesture.Pan()
          .maxPointers(1)
          .onStart(e => {
            'worklet';
            begin(0, e.x);
          })
          .onUpdate(e => {
            'worklet';
            resolve(e.x);
          })
          .onFinalize(() => {
            'worklet';
            end(0);
          }),
        Gesture.LongPress()
          .minDuration(500)
          // Don't self-cancel on movement; the pan keeps tracking.
          .maxDistance(10000)
          .shouldCancelWhenOutside(false)
          .onStart(e => {
            'worklet';
            begin(1, e.x);
          })
          .onTouchesMove(e => {
            'worklet';
            if (cursorActive.value === 1 && e.allTouches.length > 0) {
              resolve(e.allTouches[0].x);
            }
          })
          .onFinalize(() => {
            'worklet';
            end(1);
          }),
      ),
    [begin, end, resolve],
  );

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

  return (
    <GestureDetector gesture={gesture}>
      {/* Hit area only — the crosshair pixels come from LiquidGlassBackdrop. */}
      <View style={[styles.container, {height}, {width}]} collapsable={false}>
        <Animated.Image
          source={lesterImage}
          style={lesterAnimatedStyle}
          resizeMode="contain"
          pointerEvents="none"
        />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default GlassChartTouch;
