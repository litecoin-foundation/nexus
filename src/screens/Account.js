import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import AmountView from '../components/AmountView';
import AccountCell from '../components/AccountCell';
import LineChart from '../components/Chart/Chart';
import {clearWalletUnlocked} from '../reducers/authentication';
import {monthSelector} from '../reducers/ticker';

const Account = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();

  const data = useSelector(state => monthSelector(state));

  useEffect(() => {
    dispatch(clearWalletUnlocked());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <AmountView>
        <LineChart data={data} />
      </AmountView>
      <Text style={styles.text}>Accounts</Text>
      <View style={styles.accountsContainer}>
        <AccountCell onPress={() => navigate('Wallet')} />
      </View>
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
    fontSize: 11,
    letterSpacing: -0.28,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
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
