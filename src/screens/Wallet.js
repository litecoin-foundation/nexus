import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import { date, groupBy, converter } from '../lib/utils';

export class Wallet extends Component {
  static navigationOptions = {
    tabBarVisible: false
  };

  state = {
    modalTriggered: false,
    type: ''
  };

  setModalVisible(bool, type) {
    this.setState({ modalTriggered: bool, type });
  }

  render() {
    const { navigation, transactions, rates } = this.props;
    const { modalTriggered, type } = this.state;
    // TODO (util): refactor + fix this
    const txList = transactions.map(val => {
      val.date = date.formatDate(val.timeStamp);
      val.time = date.formatTime(val.timeStamp);
      val.sent = Math.sign(parseFloat(val.amount)) === -1;
      val.recieved = Math.sign(parseFloat(val.amount)) === '1';
      val.name = val.sent ? 'Sent Litecoin' : 'Received Litecoin';
      val.formattedAmount = converter.satoshisToBtc(val.amount);
      val.fiatAmount = (val.formattedAmount * rates.USD).toFixed(2);
      return val;
    });

    const groupedTransactions = groupBy(txList, 'date');

    return (
      <View style={styles.container}>
        <TransactionList navigation={navigation} groupedTransactions={groupedTransactions} />

        <View style={styles.paymentContainer}>
          <TouchableOpacity
            style={styles.payment}
            onPress={() => this.setModalVisible(true, 'send')}
          >
            <Text>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.payment}
            onPress={() => this.setModalVisible(true, 'receive')}
          >
            <Text>Receive</Text>
          </TouchableOpacity>
        </View>

        <TransactionModal
          isVisible={modalTriggered}
          type={type}
          navigation={navigation}
          close={() => this.setModalVisible(false, '')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1
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
    justifyContent: 'space-evenly'
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
    alignItems: 'center'
  }
});

const mapStateToProps = state => ({
  totalBalance: state.balance.totalBalance,
  transactions: state.transaction.transactions,
  rates: state.ticker.rates
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Wallet);
