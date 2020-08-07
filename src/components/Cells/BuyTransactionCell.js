import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

import LitecoinIcon from '../LitecoinIcon';

const BuyTransactionCell = (props) => {
  const {data, onPress} = props;

  const {
    createdAt,
    quoteCurrencyAmount,
    baseCurrencyAmount,
    feeAmount,
    extraFeeAmount,
  } = data;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LitecoinIcon />
      <View style={styles.left}>
        <Text style={styles.labelText}>Purchased Litecoin</Text>
        <Text style={styles.timeText}>{createdAt}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.text}>{`+${
          quoteCurrencyAmount === null ? '?' : quoteCurrencyAmount
        } LTC`}</Text>
        <Text style={styles.fiatText}>
          $
          {parseFloat(baseCurrencyAmount + feeAmount + extraFeeAmount).toFixed(
            2,
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 70,
    width: Dimensions.get('window').width - 30,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 15,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    shadowOffset: {
      height: 3,
      width: 0,
    },
  },
  left: {
    flexGrow: 2,
  },
  right: {
    flexGrow: 2,
    paddingRight: 15,
  },
  circle: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    marginLeft: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCircle: {
    width: 30,
    height: 30,
    borderRadius: 30 / 2,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  labelText: {
    color: '#484859',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
  },
  timeText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.31,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
    textAlign: 'right',
    color: '#2C72FF',
  },
  fiatText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: -0.17,
    textAlign: 'right',
    color: '#20BB74',
  },
});

export default BuyTransactionCell;
