import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import GreenRoundButton from './GreenRoundButton';
import { converter } from '../lib/utils';

const valueSelector = createSelector(
  state => state.balance.totalBalance,
  totalBalance => converter.satoshisToBtc(totalBalance)
);

const fiatValueSelector = createSelector(
  valueSelector,
  state => state.ticker.rates,
  (totalBalance, rates) => totalBalance * rates.USD
);

const AmountView = () => {
  const amount = useSelector(state => valueSelector(state));
  const fiatAmount = useSelector(state => fiatValueSelector(state));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5A4FE7', '#2C44C8']} style={{ height: '100%' }}>
        <SafeAreaView>
          <View style={styles.subview}>
            <View style={styles.fiat}>
              <Text style={styles.fiatText}>{fiatAmount}</Text>
            </View>
            <View style={styles.amount}>
              <Text style={styles.amountText}>{amount}</Text>
              <Text style={styles.amountSymbol}>Ł</Text>
            </View>
            <GreenRoundButton value="+0.92%" small />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 0,
    height: 300,
    width: '100%'
  },
  subview: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingTop: 50
  },
  amount: {
    height: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 5
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#FFFFFF'
  },
  amountSymbol: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 27
  },
  fiat: {
    height: 13
  },
  fiatText: {
    opacity: 0.9,
    color: '#7C96AE',
    fontSize: 11,
    letterSpacing: -0.28,
    lineHeight: 13
  }
});

export default AmountView;
