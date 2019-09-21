import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import LinearGradient from 'react-native-linear-gradient';

import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import AmountView from '../components/AmountView';

const Wallet = () => {
  const {navigate} = useNavigation();

  const [isTxTypeModalVisible, setTxTypeModalVisible] = useState(false);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);

  return (
    <View style={styles.container}>
      <AmountView />
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalVisible(true);
        }}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255, 1)']}
        style={styles.paymentContainer}>
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
      </LinearGradient>

      <TransactionModal
        isVisible={isTxTypeModalVisible}
        navigate={navigate}
        close={() => setTxTypeModalVisible(false)}
      />

      <TransactionDetailModal
        close={() => {
          setTxDetailModalVisible(false);
        }}
        isVisible={isTxDetailModalVisible}
        transaction={selectedTransaction}
      />
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
