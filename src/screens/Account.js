import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

export class Accounts extends Component {
  render() {
    const { navigation, amount, rates } = this.props;
    return (
      <View>
        <Text>Accounts</Text>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Wallet')}>
          <View style={styles.left}>
            <Text>Litecoin (LTC)</Text>
            <Text>{`${amount}LTC`}</Text>
          </View>
          <View style={styles.right}>
            <Text style={{ textAlign: 'right' }}>{amount * rates.USD}</Text>
            <Text style={{ textAlign: 'right' }}>69%</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    height: 54,
    borderRadius: 8,
    backgroundColor: 'green'
  },
  left: {
    backgroundColor: 'purple'
  },
  right: {
    backgroundColor: 'red'
  }
});

const mapStateToProps = state => ({
  amount: state.balance.totalBalance,
  rates: state.ticker.rates
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Accounts);
