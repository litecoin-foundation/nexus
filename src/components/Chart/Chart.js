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
import Svg, {Path, Line, G, Defs, LinearGradient, Stop} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import * as scale from 'd3-scale';
import {useSelector} from 'react-redux';

import Cursor from './Cursor';
import {monthSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

const d3 = {shape};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const Chart = () => {
  const {width, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = SCREEN_HEIGHT * 0.15;

  const data = useSelector(state => monthSelector(state));

  const [line, setLine] = useState('');
  const [area, setArea] = useState('');
  const x = useRef(null);
  const y = useRef(null);

  const animationValue = useSharedValue(0);

  const {processedLine, processedArea} = useMemo(() => {
    if (data === undefined || data.length === 0) {
      return {processedLine: '', processedArea: ''};
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

    const areaPath = `${calcLine} L${xScale(
      data[data.length - 1].x,
    )} ${height} L${xScale(data[0].x)} ${height} Z`;

    return {processedLine: calcLine, processedArea: areaPath};
  }, [data, width, height]);

  useEffect(() => {
    setArea(processedArea);
    setLine(processedLine);
  }, [processedArea, processedLine]);

  useEffect(() => {
    animationValue.value = 0;
    animationValue.value = withTiming(1, {duration: 1000});
  }, [line, animationValue]);

  const gradientId = 'areaGradient';
  const gradientStops = useMemo(
    () => [
      {offset: '0%', color: '#EEEEEE', opacity: 0.2},
      {offset: '40%', color: '#EEEEEE', opacity: 0.2},
      {offset: '100%', color: '#EEEEEE', opacity: 0},
    ],
    [],
  );

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: 2400 * (1 - animationValue.value),
    };
  });

  const animatedAreaProps = useAnimatedProps(() => {
    return {
      opacity: animationValue.value,
    };
  });

  const Graph = useMemo(
    () => (
      <Svg height={height} width={width}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {gradientStops.map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <AnimatedPath
          d={area}
          fill={`url(#${gradientId})`}
          stroke="none"
          animatedProps={animatedAreaProps}
        />
        <AnimatedPath
          d={line}
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeDasharray={2400}
          animatedProps={animatedProps}
        />
      </Svg>
    ),
    [
      height,
      width,
      gradientId,
      gradientStops,
      area,
      animatedAreaProps,
      line,
      animatedProps,
    ],
  );

  const GridLines = useMemo(
    () => (
      <G>
        <Line
          x1="0"
          x2="100%"
          y1="15%"
          y2="15%"
          stroke="#1853B3"
          strokeWidth="1"
          strokeOpacity={0.34}
        />
        <Line
          x1="0"
          x2="100%"
          y1="50%"
          y2="50%"
          stroke="#1853B3"
          strokeWidth="1"
          strokeOpacity={0.34}
        />
        <Line
          x1="0"
          x2="100%"
          y1="85%"
          y2="85%"
          stroke="#1853B3"
          strokeWidth="1"
          strokeOpacity={0.34}
        />
      </G>
    ),
    [],
  );

  const Container = useMemo(
    () => (
      <Svg height={height} width={width}>
        {GridLines}
        {Graph}
      </Svg>
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
