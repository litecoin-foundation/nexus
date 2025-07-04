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
import {Canvas, Path, Line, vec, Skia, Group, DashPathEffect} from '@shopify/react-native-skia';
import {useSharedValue, withTiming, useDerivedValue} from 'react-native-reanimated';
import * as scale from 'd3-scale';
import {useSelector} from 'react-redux';

import Cursor from './Cursor';
import {monthSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

const d3 = {shape};

const Chart = () => {
  const {width, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = SCREEN_HEIGHT * 0.15;

  const data = useSelector(state => monthSelector(state));

  const [line, setLine] = useState('');
  const x = useRef(null);
  const y = useRef(null);

  const animationValue = useSharedValue(0);

  const processedLine = useMemo(() => {
    if (data === undefined || data.length === 0) {
      return '';
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

    return calcLine;
  }, [data, width, height]);

  useEffect(() => {
    setLine(processedLine);
  }, [processedLine]);

  useEffect(() => {
    animationValue.value = 0;
    animationValue.value = withTiming(1, {duration: 1000});
  }, [line, animationValue]);

  const linePath = useMemo(() => {
    if (!line) {
      return null;
    }
    return Skia.Path.MakeFromSVGString(line);
  }, [line]);

  const animatedDashOffset = useDerivedValue(() => {
    return 2400 * (1 - animationValue.value);
  });

  const Graph = useMemo(
    () => (
      <Group>
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
    [linePath, animatedDashOffset],
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
