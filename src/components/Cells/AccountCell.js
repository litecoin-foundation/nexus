import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';

import {percentSyncedSelector, syncStatusSelector} from '../../reducers/info';
import {subunitSelector, subunitSymbolSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import ProgressBar from '../ProgressBar';
import LitecoinIcon from '../LitecoinIcon';

const AccountCell = (props) => {
  const {onPress, syncStatusDisabled, disabled} = props;

  const synced = useSelector((state) => syncStatusSelector(state));
  const progress = useSelector((state) => percentSyncedSelector(state));

  const totalBalance = useSelector((state) => state.balance.totalBalance);
  const convertToSubunit = useSelector((state) => subunitSelector(state));
  const amount = convertToSubunit(totalBalance);
  const amountSymbol = useSelector((state) => subunitSymbolSelector(state));

  const calculateFiatAmount = useSelector((state) => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.5}
      style={[
        styles.container,
        !synced && !syncStatusDisabled ? styles.notSynced : null,
      ]}
      onPress={onPress}>
      <View style={styles.mainContainer}>
        <LitecoinIcon />
        <View style={styles.left}>
          <Text style={styles.labelText}>Litecoin (LTC)</Text>
          <Text style={styles.differenceText}>+ 2.3%</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.text}>${fiatAmount}</Text>
          <Text style={styles.fiatText}>
            {amount} {amountSymbol}
          </Text>
        </View>
      </View>

      {!synced && !syncStatusDisabled ? (
        <View style={styles.syncContainer}>
          <ActivityIndicator
            size="small"
            color="#2C72FF"
            style={styles.indicator}
          />
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
    flexDirection: 'column',
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
    elevation: 2,
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
  labelText: {
    color: '#484859',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
  },
  fiatText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.31,
    textAlign: 'right',
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
    textAlign: 'right',
    color: '#2C72FF',
  },
  differenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: -0.17,
    textAlign: 'left',
    color: '#20BB74',
  },
  mainContainer: {
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
  notSynced: {
    height: 140,
  },
  descriptionText: {
    color: '#2E3033',
    fontSize: 12,
    fontWeight: 'bold',
  },
  indicator: {
    paddingLeft: 22,
    paddingRight: 21,
  },
});

export default AccountCell;
