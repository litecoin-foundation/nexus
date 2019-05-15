import React, { Component } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import TransactionCell from '../components/TransactionCell';

export class Transaction extends Component {
  render() {
    const { navigation } = this.props;
    const transaction = navigation.getParam('item', {});
    const addresses = transaction.destAddresses.map(val => {
      return <Text key={val}>{val}</Text>;
    });
    return (
      <View style={styles.container}>
        <TransactionCell item={transaction} />
        <ScrollView>
          <View>
            <Text>Sender</Text>
            <Text>{transaction.send === true ? 'Me' : 'Them'}</Text>
          </View>
          <View>
            <Text>Recipient</Text>
            <Text>{transaction.recieved === true ? 'Me' : 'Them'}</Text>
          </View>
          <View>
            <Text>Addresses</Text>
            {addresses}
          </View>
          <View>
            <Text>Time & Date</Text>
            <Text>{`${transaction.date}, ${transaction.time}`}</Text>
          </View>
          <View>
            <Text>Amount in FIAT</Text>
            <Text>{transaction.fiatAmount}</Text>
          </View>
          <View>
            <Text>Amount in LTC</Text>
            <Text>{transaction.formattedAmount}</Text>
          </View>
          <View>
            <Text>Transaction ID (txid)</Text>
            <Text>{transaction.txHash}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 400
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction);
