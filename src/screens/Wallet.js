import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import {createSelector} from 'reselect';
import {useNavigation} from 'react-navigation-hooks';

import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import AmountView from '../components/AmountView';
import {date, groupBy, converter} from '../lib/utils';

const transactionSelector = createSelector(
  state => state.transaction.transactions,
  tx =>
    tx.map(data => {
      const sign = Math.sign(parseFloat(data.amount)) === -1;
      const name = sign ? 'Sent Litecoin' : 'Received Litecoin';
      const hash = data.txHash;
      const amount = converter.satoshisToBtc(data.amount);
      const fee = data.totalFees;
      const confs = data.numConfirmations;
      const day = date.formatDate(data.timeStamp);
      const time = date.formatTime(data.timeStamp);
      const type = 'litecoin onchain';
      const addresses = data.destAddresses;
      return {name, sign, hash, amount, fee, confs, day, time, type, addresses};
    }),
);

const Wallet = () => {
  const {navigate} = useNavigation();
  const transactions = useSelector(state => transactionSelector(state));

  const [isTxTypeModalVisible, setTxTypeModalVisible] = useState(false);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);

  const groupedTransactions = groupBy(transactions, 'day');

  return (
    <View style={styles.container}>
      <AmountView />
      <TransactionList
        groupedTransactions={groupedTransactions}
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalVisible(true);
        }}
      />

      <View style={styles.paymentContainer}>
        <TouchableOpacity
          style={styles.payment}
          onPress={() => {
            navigate('Send');
          }}>
          <Text>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payment}
          onPress={() => {
            setTxTypeModalVisible(true);
          }}>
          <Text>Receive</Text>
        </TouchableOpacity>
      </View>

      <TransactionModal
        isVisible={isTxTypeModalVisible}
        navigate={navigate}
        close={() => setTxTypeModalVisible(false)}
      />
      {selectedTransaction ? (
        <TransactionDetailModal
          close={() => {
            setTxDetailModalVisible(false);
            selectTransaction(null);
          }}
          isVisible={isTxDetailModalVisible}
          transaction={selectedTransaction}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  paymentContainer: {
    paddingTop: 30,
    paddingBottom: 30,
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-evenly',
  },
  payment: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

Wallet.navigationOptions = {
  headerTitle: 'LTC Wallet',
  tabBarVisible: false,
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
  headerTransparent: true,
  headerBackTitle: null,
};

export default Wallet;
