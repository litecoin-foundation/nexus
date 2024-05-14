import React from 'react';
import {View, Text, StyleSheet, Platform, SafeAreaView} from 'react-native';

import {chartPercentageChangeSelector} from '../reducers/chart';
import {subunitSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {useAppSelector} from '../store/hooks';
import PriceIndicatorButton from './Buttons/PriceIndictorButton';
import Animated from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  animatedProps: any; // TODO
}

const NewAmountView: React.FC<Props> = props => {
  const {children, animatedProps} = props;
  const chartCursorSelected = useAppSelector(
    state => state.chart.cursorSelected,
  );
  const chartCursorValue = useAppSelector(state => state.chart.cursorValue);
  const chartPercentageChange = useAppSelector(state =>
    chartPercentageChangeSelector(state),
  );

  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const convertToSubunit = useAppSelector(state => subunitSelector(state));
  const subunitAmount = convertToSubunit(totalBalance);

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);
  return (
    <Animated.View style={[styles.container, animatedProps]}>
      <SafeAreaView>
        <View style={styles.subview}>
          {!chartCursorSelected ? (
            <>
              <Text style={styles.amountText}>{subunitAmount}</Text>
              <View style={styles.fiat}>
                <Text style={styles.fiatText}>{fiatAmount}</Text>
                <PriceIndicatorButton value={Number(chartPercentageChange)} />
                <Text style={styles.fiatText}>{chartPercentageChange}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.amount, styles.margin]}>
                <Text style={styles.amountText}>${chartCursorValue}</Text>
              </View>
            </>
          )}
        </View>
        <View style={styles.childrenContainer}>{children}</View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 0,
    width: '100%',
    backgroundColor: '#1162E6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  subview: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  amount: {
    height: 67,
  },
  amountText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '400',
    color: 'white',
    fontSize: 48,
  },
  fiat: {
    alignItems: 'center',
    gap: 7,
    flexDirection: 'row',
  },
  fiatText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 12,
  },
  gradient: {
    height: '100%',
  },
  childrenContainer: {
    paddingTop: 29,
    flex: 1,
  },
  margin: {
    marginTop: 10,
  },
});

export default NewAmountView;
