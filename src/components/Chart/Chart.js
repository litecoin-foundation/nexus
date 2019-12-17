import React, {useEffect} from 'react';
import {Dimensions} from 'react-native';
import * as shape from 'd3-shape';
import * as array from 'd3-array';
import Svg, {Path, Line, G} from 'react-native-svg';
import * as scale from 'd3-scale';
import {useDispatch} from 'react-redux';

import Cursor from './Cursor';
import {getHistoricalRates} from '../../reducers/ticker';

const d3 = {shape};

const height = 130;
const {width} = Dimensions.get('window');

const Chart = props => {
  const {data} = props;
  const dispatch = useDispatch();

  const yValues = data.map(item => item.y);
  const xValues = data.map(item => item.x);
  const yExtent = array.extent(yValues);
  const xExtent = array.extent(xValues);

  const x = scale
    .scaleTime()
    .range([0, width])
    .domain([xExtent[0], xExtent[1]]);
  const y = scale
    .scaleLinear()
    .range([height - 5, 5])
    .domain([yExtent[0], yExtent[1]]);

  const line = d3.shape
    .line()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .curve(d3.shape.curveBasis)(data);

  useEffect(() => {
    dispatch(getHistoricalRates());
  }, [dispatch]);

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
      x={x}
      y={y}
      useCounterValue={false}>
      {Container}
    </Cursor>
  );
};

export default Chart;
