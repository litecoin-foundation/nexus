import React, {Fragment} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';

import GreenRoundButton from './Buttons/GreenRoundButton';
import {chartPercentageChangeSelector} from '../reducers/chart';
import {subunitSelector, subunitSymbolSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';

const AmountView = (props) => {
  const {children} = props;

  const chartCursorSelected = useSelector(
    (state) => state.chart.cursorSelected,
  );
  const chartCursorValue = useSelector((state) => state.chart.cursorValue);
  const chartPercentageChange = useSelector((state) =>
    chartPercentageChangeSelector(state),
  );

  const totalBalance = useSelector((state) => state.balance.totalBalance);
  const convertToSubunit = useSelector((state) => subunitSelector(state));
  const subunitAmount = convertToSubunit(totalBalance);
  const amountSymbol = useSelector((state) => subunitSymbolSelector(state));

  const calculateFiatAmount = useSelector((state) => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);

  return (
    <View
      style={[
        styles.container,
        DeviceInfo.hasNotch() ? styles.notch : styles.noNotch,
      ]}>
      <LinearGradient colors={['#7E58FF', '#003DB3']} style={styles.gradient}>
        <View style={styles.maskContainer}>
          <LinearGradient
            colors={['#7E58FF', '#00369E']}
            style={styles.secondGradient}>
            <View style={styles.first} />
          </LinearGradient>
        </View>

        <View style={styles.subview}>
          {!chartCursorSelected ? (
            <Fragment>
              <View style={styles.fiat}>
                <Text style={styles.fiatText}>${fiatAmount}</Text>
              </View>
              <View style={styles.amount}>
                <Text style={styles.amountText}>{subunitAmount}</Text>
                <Text style={styles.amountSymbol}>{amountSymbol}</Text>
              </View>
              <GreenRoundButton
                value={chartPercentageChange ? chartPercentageChange : ''}
                small
              />
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
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 0,
    width: '100%',
  },
  subview: {
    height: 190,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingTop: 90,
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
    height: 12,
  },
  fiatText: {
    opacity: 0.9,
    color: '#c3d5e6',
    fontSize: 11,
    letterSpacing: -0.28,
    lineHeight: 13,
  },
  gradient: {
    height: '100%',
  },
  childrenContainer: {
    flex: 1,
  },
  margin: {
    marginTop: 10,
  },
  noNotch: {
    height: 380,
  },
  notch: {
    height: 390,
  },
  maskContainer: {
    position: 'absolute',
    width: '100%',
  },
  secondGradient: {
    alignSelf: 'center',
    width: 110,
    height: 190,
    borderBottomRightRadius: 70,
    borderBottomLeftRadius: 70,
    transform: [{scaleX: 4}],
    opacity: 0.1,
  },
});

export default AmountView;
