import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useMemo,
  memo,
} from 'react';
import * as shape from 'd3-shape';
import * as array from 'd3-array';
import {
  Canvas,
  Path,
  Line,
  vec,
  Skia,
  Group,
  DashPathEffect,
  LinearGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
  useDerivedValue,
} from 'react-native-reanimated';
import * as scale from 'd3-scale';
import {useSelector} from 'react-redux';

import Cursor from './Cursor';
import {monthSelector} from '../../reducers/ticker';
import {walletBalanceHistorySelector} from '../../reducers/transaction';

import {ScreenSizeContext} from '../../context/screenSize';

const d3 = {shape};

const Chart = () => {
  const {width, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = SCREEN_HEIGHT * 0.15;

  const chartMode = useSelector(state => state.settings.chartMode);
  const priceData = useSelector(state => monthSelector(state));
  const balanceData = useSelector(state => walletBalanceHistorySelector(state));

  // Use balance data when in balance mode, otherwise use price data
  // Ensure data is always an array, never null/undefined
  const data = chartMode === 'balance' ? balanceData || [] : priceData || [];

  const [line, setLine] = useState({line: '', area: ''});
  const x = useRef(null);
  const y = useRef(null);

  const animationValue = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  const processedLine = useMemo(() => {
    if (data === undefined || data.length === 0) {
      // Still initialize scales even with empty data
      // This ensures Lester animation can check for their existence
      const defaultScale = scale.scaleLinear().range([0, width]).domain([0, 1]);
      x.current = defaultScale;
      y.current = defaultScale;
      return {line: '', area: ''};
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

    x.current = xScale;
    y.current = yScale;

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

    return {line: calcLine, area: calcArea};
  }, [data, width, height]);

  useEffect(() => {
    setLine(processedLine);
  }, [processedLine]);

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

  const Graph = useMemo(
    () => (
      <Group>
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
    [linePath, areaPath, animatedDashOffset, animatedGradientOpacity, height],
  );

  const GridLines = useMemo(
    () => (
      <Group>
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
      </Group>
    ),
    [height, width],
  );

  const Container = useMemo(
    () => (
      <Canvas style={{height, width}}>
        {GridLines}
        {Graph}
      </Canvas>
    ),
    [height, width, GridLines, Graph],
  );

  return (
    <Cursor
      width={width}
      height={height}
      data={data}
      x={x.current}
      y={y.current}
      useCounterValue={false}>
      {Container}
    </Cursor>
  );
};

export default memo(Chart);
