import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';
import LinearGradient from 'react-native-linear-gradient';

import AmountView from '../components/AmountView';
import AccountCell from '../components/Cells/AccountCell';
import LineChart from '../components/Chart/Chart';
import DatePicker from '../components/DatePicker';
import {clearWalletUnlocked} from '../reducers/authentication';
import {formatDate} from '../lib/utils/date';

const Account = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();

  const chartCursorDate = useSelector(state => state.chart.cursorDate);
  const chartCursorSelected = useSelector(state => state.chart.cursorSelected);

  useEffect(() => {
    dispatch(clearWalletUnlocked());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <AmountView>
        <LineChart />
        {chartCursorSelected ? (
          <Text style={styles.chartDateText}>
            {formatDate(chartCursorDate)}
          </Text>
        ) : (
          <View style={styles.emptyTextView} />
        )}
        <DatePicker />
      </AmountView>
      <LinearGradient
        colors={
          Platform.OS === 'android'
            ? ['#eef4f9', '#eef4f9']
            : ['#F6F9FC', '#d2e1ef00']
        }
        style={styles.container}>
        <Text style={styles.text}>Accounts</Text>
        <View style={styles.accountsContainer}>
          <AccountCell onPress={() => navigate('Wallet')} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
  headerTransparent: true,
  headerBackTitle: null,
};

export default Account;
