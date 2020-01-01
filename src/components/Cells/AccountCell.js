import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';

import ProgressBar from '../ProgressBar';
import {percentSyncedSelector, syncStatusSelector} from '../../reducers/info';
import {rateSelector} from '../../reducers/ticker';
import {balanceSelector} from '../../reducers/balance';

const AccountCell = props => {
  const {onPress, syncStatusDisabled, disabled} = props;

  const synced = useSelector(state => syncStatusSelector(state));
  const progress = useSelector(state => percentSyncedSelector(state));
  const rates = useSelector(state => rateSelector(state));
  const balance = useSelector(state => balanceSelector(state));

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.5}
      style={[
        styles.container,
        !synced && !syncStatusDisabled ? styles.notSynced : null,
      ]}
      onPress={onPress}>
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
        <Text style={styles.labelText}>Litecoin (LTC)</Text>
        <Text style={styles.timeText}>{`${balance} LTC`}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.text}>{balance * rates.USD}</Text>
        <Text style={styles.fiatText}>+$6.01</Text>
      </View>
      {!synced && !syncStatusDisabled ? (
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
    flexDirection: 'row',
    height: 70,
    width: 360,
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
  syncContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#d6d7da',
  },
  notSynced: {
    height: 140,
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
