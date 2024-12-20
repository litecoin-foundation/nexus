import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';

import {useAppDispatch, useAppSelector} from '../store/hooks';
import DateButton from './Buttons/DateButton';
import {changeGraphPeriod} from '../reducers/chart';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {}

type GraphPeriodType = ('1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL')[];

const DatePicker: React.FC<Props> = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const currentGraphPeriod = useAppSelector(state => state.chart.graphPeriod);

  const options: GraphPeriodType = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const buttons = options.map(value => {
    return (
      <DateButton
        value={value}
        onPress={() => dispatch(changeGraphPeriod(value))}
        customFontStyles={styles.smallFont}
        active={currentGraphPeriod === value ? true : false}
        key={value}
      />
    );
  });

  return <View style={styles.container}>{buttons}</View>;
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginLeft: screenHeight * 0.03,
      marginRight: screenHeight * 0.03,
    },
    smallFont: {
      fontSize: screenHeight * 0.011,
    },
  });

export default DatePicker;
