import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

const BlueButton = props => {
  const {value, onPress, disabled} = props;
  return (
    <TouchableOpacity
      style={[styles.container, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: 335,
    backgroundColor: '#2C72FF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(68,130,255)',
    shadowOpacity: 0.41,
    shadowRadius: 6,
    elevation: 3,
    shadowOffset: {
      height: 1,
      width: 0,
    },
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});

export default BlueButton;
