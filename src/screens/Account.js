import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';

import AmountView from '../components/AmountView';
import AccountCell from '../components/Cells/AccountCell';
import LineChart from '../components/Chart/Chart';
import DatePicker from '../components/DatePicker';
import {formatDate, formatTime} from '../lib/utils/date';
import InfoCell from '../components/Cells/InfoCell';

const Account = (props) => {
  const chartCursorDate = useSelector((state) => state.chart.cursorDate);
  const chartCursorSelected = useSelector(
    (state) => state.chart.cursorSelected,
  );
  const {isInternetReachable} = useSelector((state) => state.info);

  return (
    <View style={styles.container}>
      <AmountView>
        <LineChart />
        {chartCursorSelected ? (
          <Text style={styles.chartDateText}>
            {formatDate(chartCursorDate)} {formatTime(chartCursorDate)}
          </Text>
        ) : (
          <View style={styles.emptyTextView} />
        )}
        <DatePicker />
      </AmountView>
      <View style={styles.container}>
        <ScrollView>
          {!isInternetReachable ? (
            <>
              <Text style={styles.text}>Alerts</Text>
              <InfoCell text="Internet connection unavailable!" />
            </>
          ) : null}
          <Text style={styles.text}>Accounts</Text>
          <View style={styles.accountsContainer}>
            <AccountCell onPress={() => props.navigation.navigate('Wallet')} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  accountsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: '#7C96AE',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    paddingTop: 30,
    paddingLeft: 15,
    paddingBottom: 4,
  },
  chartDateText: {
    height: 13,
    opacity: 0.5,
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
  emptyTextView: {
    height: 13,
  },
});

Account.navigationOptions = {
  headerTitle: 'Your Wallet',
  headerLeft: null,
};

export default Account;
