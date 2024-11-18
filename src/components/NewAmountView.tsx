import React from 'react';
import {View, Text, StyleSheet, Platform, SafeAreaView} from 'react-native';

import {chartPercentageChangeSelector} from '../reducers/chart';
import {subunitSelector} from '../reducers/settings';
import {fiatValueSelector} from '../reducers/ticker';
import {useAppSelector} from '../store/hooks';
import PriceIndicatorButton from './Buttons/PriceIndictorButton';
import Animated from 'react-native-reanimated';
import {formatDate, formatTime} from '../lib/utils/date';

interface Props {
  children: React.ReactNode;
  animatedProps: any; // TODO
  currentWallet: string;
}

const NewAmountView: React.FC<Props> = props => {
  const {children, animatedProps, currentWallet} = props;
  const chartCursorSelected = useAppSelector(
    state => state.chart.cursorSelected,
  );
  const chartCursorValue = useAppSelector(state => state.chart.cursorValue);
  const chartCursorDate = useAppSelector(state => state.chart.cursorDate);
  const chartPercentageChange = useAppSelector(state =>
    chartPercentageChangeSelector(state),
  );

  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const convertToSubunit = useAppSelector(state => subunitSelector(state));
  const subunitAmount = convertToSubunit(totalBalance);

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);

  const {isInternetReachable} = useAppSelector(state => state.info);
  return (
    <Animated.View
      style={[
        styles.container,
        animatedProps,
        !isInternetReachable ? styles.internetBackground : null,
      ]}>
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
              <Text style={styles.amountText}>${chartCursorValue}</Text>
              <View style={styles.fiat}>
                <Text style={[styles.fiatText, {paddingBottom: 2}]}>
                  {formatDate(chartCursorDate)} {formatTime(chartCursorDate)}
                </Text>
              </View>
            </>
          )}
        </View>
        {isInternetReachable ? (
          <View style={styles.childrenContainer}>{children}</View>
        ) : (
          <View style={styles.internetContainer}>
            <Text style={styles.internetText}>
              You are offline.
              {'\n'}
              Connect to the internet.
            </Text>
          </View>
        )}
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
    top: 40,
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
  internetContainer: {
    paddingTop: 60,
  },
  internetText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '500',
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  internetBackground: {
    backgroundColor: '#F36F56',
  },
});

export default NewAmountView;
