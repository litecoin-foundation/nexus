import React from 'react';
import {View, StyleSheet} from 'react-native';

import {useAppDispatch, useAppSelector} from '../store/hooks';
import WhiteButton from './Buttons/WhiteButton';
import {changeGraphPeriod} from '../reducers/chart';

interface Props {}

type GraphPeriodType = ('1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL')[];

const DatePicker: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const currentGraphPeriod = useAppSelector(state => state.chart.graphPeriod);

  const options: GraphPeriodType = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const buttons = options.map(value => {
    return (
      <WhiteButton
        value={value}
        small={true}
        onPress={() => dispatch(changeGraphPeriod(value))}
        customFontStyles={styles.smallFont}
        active={currentGraphPeriod === value ? true : false}
        key={value}
      />
    );
  });

  return <View style={styles.container}>{buttons}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginLeft: 30,
    marginRight: 30,
  },
  smallFont: {
    fontSize: 11,
  },
});

export default DatePicker;
