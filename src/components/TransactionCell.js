import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const TransactionCell = props => {
  const {item, onPress} = props;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle} />
      <View style={styles.left}>
        <Text>{item.name}</Text>
        <Text>{item.time}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.text}>{`${item.amount} LTC`}</Text>
        <Text style={styles.text}>{item.fiatAmount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 70,
    width: 360,
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
      width: 0,
    },
  },
  left: {
    flexGrow: 2,
  },
  right: {
    flexGrow: 2,
    paddingRight: 12,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
    backgroundColor: '#FF00FF',
    marginLeft: 12,
    marginRight: 10,
  },
  text: {
    textAlign: 'right',
  },
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
    txHash: PropTypes.string,
  }).isRequired,
};

export default TransactionCell;
