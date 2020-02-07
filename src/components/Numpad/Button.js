import React from 'react';
import PropTypes from 'prop-types';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';

import {triggerSelectionFeedback} from '../../lib/utils/haptic';

const Button = props => {
  const {value, onPress, disabled} = props;
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled ? styles.disabled : null]}
        disabled={disabled}
        onPress={() => {
          triggerSelectionFeedback();
          onPress();
        }}>
        <Text style={styles.text}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '33%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 72,
    borderRadius: 72 / 2,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C72FF',
  },
  disabled: {
    opacity: 0,
  },
});

Button.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default Button;
