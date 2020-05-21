import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import WhiteButton from './Buttons/WhiteButton';
import {changeGraphPeriod} from '../reducers/chart';

const DatePicker = () => {
  const dispatch = useDispatch();
  const currentGraphPeriod = useSelector((state) => state.chart.graphPeriod);

  const options = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const buttons = options.map((value) => {
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginLeft: 30,
    marginRight: 30,
    paddingTop: 15,
  },
  smallFont: {
    fontSize: 11,
  },
});

export default DatePicker;
