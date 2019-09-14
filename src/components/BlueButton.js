import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const BlueButton = props => {
  const {value, onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
});

BlueButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default BlueButton;
