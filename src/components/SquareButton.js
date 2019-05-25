import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const SquareButton = props => {
  const { value, onPress } = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0
    }
  }
});

SquareButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func
};

export default SquareButton;
