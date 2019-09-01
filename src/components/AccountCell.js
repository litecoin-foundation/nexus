import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

import ProgressBar from './ProgressBar';

const AccountCell = props => {
  const {onPress, amount, rates, progress, synced} = props;
  return (
    <TouchableOpacity
      style={[styles.container, !synced ? styles.notSynced : null]}
      onPress={onPress}>
      <View style={styles.subContainer}>
        <View style={styles.circle} />
        <View style={styles.left}>
          <Text>Litecoin (LTC)</Text>
          <Text>{`${amount}LTC`}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.text}>{amount * rates.USD}</Text>
          <Text style={styles.text}>69%</Text>
        </View>
      </View>
      {!synced ? (
        <View style={styles.syncContainer}>
          <View style={styles.circle} />
          <View style={styles.left}>
            <Text>This account is currently syncing...</Text>
            <ProgressBar progress={progress * 100} />
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  subContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#d6d7da',
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
  notSynced: {
    height: 140,
  },
  text: {
    textAlign: 'right',
  },
});

AccountCell.propTypes = {
  onPress: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired,
  rates: PropTypes.objectOf(PropTypes.string).isRequired,
  progress: PropTypes.number,
  synced: PropTypes.bool.isRequired,
};

export default AccountCell;
