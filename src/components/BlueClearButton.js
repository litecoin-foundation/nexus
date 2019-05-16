import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const BlueClearButton = props => {
  const { value, onPress } = props;
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
    borderColor: '#2C72FF',
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  text: {
    fontSize: 15,
    color: '#2C72FF',
    letterSpacing: 0.1
  }
});

BlueClearButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func
};

export default BlueClearButton;
