import React, {useEffect, useState, useRef} from 'react';
import {Dimensions} from 'react-native';
import * as shape from 'd3-shape';
import * as array from 'd3-array';
import Svg, {Path, Line, G} from 'react-native-svg';
import * as scale from 'd3-scale';
import {useDispatch, useSelector} from 'react-redux';

import Cursor from './Cursor';
import {updateHistoricalRates} from '../../reducers/ticker';
import {monthSelector} from '../../reducers/ticker';

const d3 = {shape};

const height = 130;
const {width} = Dimensions.get('window');

const Chart = () => {
  const dispatch = useDispatch();
  const data = useSelector(state => monthSelector(state));

  const [line, setLine] = useState('');
  const x = useRef(null);
  const y = useRef(null);

  useEffect(() => {
    dispatch(updateHistoricalRates());
  }, [dispatch]);

  useEffect(() => {
    if (data === undefined || data.length === 0) {
      return;
    }

    const yValues = data.map(item => item.y);
    const xValues = data.map(item => item.x);
    const yExtent = array.extent(yValues);
    const xExtent = array.extent(xValues);

    x.current = scale
      .scaleTime()
      .range([0, width - 20])
      .domain([xExtent[0], xExtent[1]]);
    y.current = scale
      .scaleLinear()
      .range([height - 5, 5])
      .domain([yExtent[0], yExtent[1]]);

    const calcLine = d3.shape
      .line()
      .x(d => x.current(d.x))
      .y(d => y.current(d.y))
      .curve(d3.shape.curveBasis)(data);

    setLine(calcLine);
  }, [data, line]);

  const Graph = (
    <Svg height={height} width={width}>
      <Path d={line} fill="transparent" stroke="white" strokeWidth={3} />
    </Svg>
  );

  const Container = (
    <Svg height={height} width={width}>
      <G>
        <Line
          x1="0"
          x2="100%"
          y1="15%"
          y2="15%"
          stroke="white"
          strokeWidth="1"
          strokeOpacity={0.2}
        />
        <Line
          x1="0"
          x2="100%"
          y1="50%"
          y2="50%"
          stroke="white"
          strokeWidth="1"
          strokeOpacity={0.2}
        />
        <Line
          x1="0"
          x2="100%"
          y1="85%"
          y2="85%"
          stroke="white"
          strokeWidth="1"
          strokeOpacity={0.2}
        />
      </G>

      {Graph}
    </Svg>
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

export default Chart;
