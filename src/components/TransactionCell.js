import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const TransactionCell = props => {
  const { item, onPress } = props;
  // TODO: refactor this, item computes unnecessary data
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle} />
      <View style={styles.left}>
        <Text>{item.name}</Text>
        <Text>{item.time}</Text>
      </View>
      <View style={styles.right}>
        <Text style={{ textAlign: 'right' }}>{`${item.formattedAmount} LTC`}</Text>
        <Text style={{ textAlign: 'right' }}>{item.fiatAmount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 60,
    width: 335,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 10,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  left: {
    flexGrow: 2
  },
  right: {
    flexGrow: 2,
    paddingRight: 12
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
    backgroundColor: '#FF00FF',
    marginLeft: 12,
    marginRight: 10
  }
});

TransactionCell.propTypes = {
  onPress: PropTypes.func,
  item: PropTypes.shape({
    amount: PropTypes.number,
    blockHash: PropTypes.string,
    blockHeight: PropTypes.number,
    date: PropTypes.string,
    destAddresses: PropTypes.array,
    fiatAmount: PropTypes.string,
    formattedAmount: PropTypes.number,
    name: PropTypes.string,
    numConfirmations: PropTypes.number,
    recieved: PropTypes.bool,
    sent: PropTypes.bool,
    time: PropTypes.string,
    timeStamp: PropTypes.number,
    txHash: PropTypes.string
  }).isRequired
};

export default TransactionCell;
