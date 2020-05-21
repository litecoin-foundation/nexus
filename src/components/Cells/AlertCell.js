import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';

import LitecoinIcon from '../LitecoinIcon';
import Switch from '../Buttons/Switch';
import {setAlertAvailability} from '../../reducers/alerts';

const AlertCell = (props) => {
  const {data, onPress} = props;
  const item = data;
  const dispatch = useDispatch();

  const handleSwitch = (value) => {
    dispatch(setAlertAvailability(item.id, value));
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item.id)}>
      <View style={styles.topContainer}>
        <View style={styles.subContainer}>
          <LitecoinIcon size={44} />
          <View>
            <Text style={styles.text}>Litecoin (LTC) is above</Text>
            <Text style={styles.valueText}>${item.value}</Text>
          </View>
        </View>
        <View style={styles.switchContainer}>
          <Switch initialValue={item.enabled} onPress={handleSwitch} />
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={styles.dateText}>
          Last time LTC reached this value was Apr 21 2018
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 123,
    borderColor: '#97979748',
    borderBottomWidth: 1,
    flex: 1,
    backgroundColor: 'white',
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 80,
    borderWidth: 0,
    borderColor: 'red',
    paddingTop: 15,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 15,
    borderWidth: 0,
    borderColor: 'green',
    paddingTop: 9,
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchContainer: {
    justifyContent: 'center',
    paddingRight: 15,
  },
  text: {
    color: '#484859',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: -0.18,
  },
  valueText: {
    color: '#2C72FF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.39,
  },
  dateText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
});

export default AlertCell;
