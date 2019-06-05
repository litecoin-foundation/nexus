import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const GreenRoundButton = props => {
  const { value, small, onPress, disabled } = props;
  return (
    <TouchableOpacity
      onPress={disabled ? null : onPress}
      style={[
        styles.container,
        small ? styles.small : styles.big,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#20BB74',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  small: {
    height: 24,
    width: 70,
    borderRadius: 12
  },
  big: {
    height: 44,
    width: 91,
    borderRadius: 7
  },
  disabled: {
    opacity: 0.2
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
});

GreenRoundButton.propTypes = {
  value: PropTypes.string.isRequired,
  small: PropTypes.bool,
  onPress: PropTypes.func,
  disabled: PropTypes.bool
};

export default GreenRoundButton;
