import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';

import ProgressBar from '../ProgressBar';
import {percentSyncedSelector, syncStatusSelector} from '../../reducers/info';
import {rateSelector} from '../../reducers/ticker';
import {balanceSelector} from '../../reducers/balance';

const AccountCell = props => {
  const {onPress} = props;

  const synced = useSelector(state => syncStatusSelector(state));
  const progress = useSelector(state => percentSyncedSelector(state));
  const rates = useSelector(state => rateSelector(state));
  const balance = useSelector(state => balanceSelector(state));

  return (
    <TouchableOpacity
      style={[styles.container, !synced ? styles.notSynced : null]}
      onPress={onPress}>
      <View style={styles.subContainer}>
        <LinearGradient
          colors={['#6954F2', 'rgb(0, 61, 179)']}
          style={styles.circle}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              resizeMode="contain"
              source={require('../../assets/images/ltc-logo.png')}
            />
          </View>
        </LinearGradient>
        <View style={styles.left}>
          <Text style={styles.nameText}>Litecoin (LTC)</Text>
          <Text style={styles.leftValueText}>{`${balance} LTC`}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightValueText}>{balance * rates.USD}</Text>
          <Text style={styles.percentageText}>+0.6%</Text>
        </View>
      </View>
      {!synced ? (
        <View style={styles.syncContainer}>
          <View style={styles.circle} />
          <View style={styles.left}>
            <Text style={styles.descriptionText}>
              This account is currently syncing...
            </Text>
            <ProgressBar progress={progress * 100} />
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 68,
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: 'rgba(82,84,103,0.5)',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      height: 6,
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
    marginLeft: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notSynced: {
    height: 140,
  },
  percentageText: {
    color: '#20BB74',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  nameText: {
    color: '#484859',
    fontSize: 13,
    fontWeight: 'bold',
  },
  leftValueText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '500',
  },
  rightValueText: {
    color: '#2C72FF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  imageContainer: {
    height: 15,
    width: 15,
  },
  image: {
    flex: 1,
    height: undefined,
    width: undefined,
  },
  descriptionText: {
    color: '#2E3033',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AccountCell;
