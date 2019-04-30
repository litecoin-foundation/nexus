import React, { Component } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { date, groupBy, converter } from '../lib/utils';

export class Wallet extends Component {
  render() {
    const { navigation, transactions, rates } = this.props;

    const txList = transactions.map(val => {
      val.date = date.formatDate(val.timeStamp);
      val.time = date.formatTime(val.timeStamp);
      val.sent = Math.sign(val.amount) === '-1';
      val.recieved = Math.sign(val.amount) === '1';
      val.name = val.sent ? 'Sent Litecoin' : 'Received Litecoin';
      val.formattedAmount = converter.satoshisToBtc(val.amount);
      val.fiatAmount = val.formattedAmount * rates.USD;
      return val;
    });

    const groupedTransactions = groupBy(txList, 'date');

    return (
      <View style={styles.container}>
        <SectionList
          sections={groupedTransactions}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Text>{item.name}</Text>
                <Text>{item.time}</Text>
              </View>
              <View style={styles.right}>
                <Text style={{ textAlign: 'right' }}>{`${item.formattedAmount} LTC`}</Text>
                <Text style={{ textAlign: 'right' }}>{item.fiatAmount}</Text>
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          keyExtractor={item => item.txHash}
        />
        <View style={styles.paymentContainer}>
          <TouchableOpacity style={styles.payment} onPress={() => navigation.navigate('Send')}>
            <Text>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payment} onPress={() => navigation.navigate('Receive')}>
            <Text>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: '5%',
    paddingRight: '5%'
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 8,
    backgroundColor: 'green',
    marginTop: 5,
    marginBottom: 5
  },
  left: {
    backgroundColor: 'purple'
  },
  right: {
    backgroundColor: 'red'
  },
  payment: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14
  },
  paymentContainer: {
    flex: 1,
    flexWrap: 'nowrap',
    flexDirection: 'row',
    justifyContent: 'center'
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
