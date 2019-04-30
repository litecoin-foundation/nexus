import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

export class Transaction extends Component {
  render() {
    const { navigation } = this.props;
    const transaction = navigation.getParam('item', {});
    const addresses = transaction.destAddresses.map((val, indx) => {
      return <Text>{val}</Text>;
    });
    return (
      <View>
        <TouchableOpacity>
          <View>
            <View>
              <Text>{transaction.name}</Text>
              <Text>{transaction.time}</Text>
            </View>
            <View>
              <Text style={{ textAlign: 'right' }}>{`${transaction.formattedAmount} LTC`}</Text>
              <Text style={{ textAlign: 'right' }}>{transaction.fiatAmount}</Text>
            </View>
          </View>
        </TouchableOpacity>
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

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transaction);
