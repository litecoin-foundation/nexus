import React, {Fragment} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {createSelector} from 'reselect';

import GreenRoundButton from './Buttons/GreenRoundButton';
import {converter} from '../lib/utils';
import {chartPercentageChangeSelector} from '../reducers/chart';

const valueSelector = createSelector(
  state => state.balance.totalBalance,
  totalBalance => converter.satoshisToBtc(totalBalance),
);

const fiatValueSelector = createSelector(
  valueSelector,
  state => state.ticker.rates,
  (totalBalance, rates) => totalBalance * rates.USD,
);

const AmountView = props => {
  const {children} = props;
  const amount = useSelector(state => valueSelector(state));
  const fiatAmount = useSelector(state => fiatValueSelector(state));
  const chartCursorSelected = useSelector(state => state.chart.cursorSelected);
  const chartCursorValue = useSelector(state => state.chart.cursorValue);
  const chartPercentageChange = useSelector(state =>
    chartPercentageChangeSelector(state),
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7E58FF', '#003DB3']} style={styles.gradient}>
        <SafeAreaView>
          <View style={styles.subview}>
            {!chartCursorSelected ? (
              <Fragment>
                <View style={styles.fiat}>
                  <Text style={styles.fiatText}>{fiatAmount}</Text>
                </View>
                <View style={styles.amount}>
                  <Text style={styles.amountText}>{amount}</Text>
                  <Text style={styles.amountSymbol}>Ł</Text>
                </View>
                <GreenRoundButton value={chartPercentageChange} small />
              </Fragment>
            ) : (
              <Fragment>
                <View style={[styles.amount, styles.margin]}>
                  <Text style={styles.amountText}>${chartCursorValue}</Text>
                </View>
              </Fragment>
            )}
          </View>
          <View style={styles.childrenContainer}>{children}</View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 0,
    height: 400,
    width: '100%',
  },
  subview: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingTop: 50,
  },
  amount: {
    height: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 2,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  amountSymbol: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 27,
  },
  fiat: {
    height: 10,
  },
  fiatText: {
    opacity: 0.9,
    color: '#7C96AE',
    fontSize: 11,
    letterSpacing: -0.28,
    lineHeight: 13,
  },
  gradient: {
    height: '100%',
  },
  childrenContainer: {
    flex: 1,
    paddingTop: 110,
  },
  margin: {
    marginTop: 10,
  },
});

export default AmountView;
