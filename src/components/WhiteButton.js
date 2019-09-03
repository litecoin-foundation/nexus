import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const WhiteButton = props => {
  const {value, onPress, small} = props;
  return (
    <TouchableOpacity
      style={[styles.container, small ? styles.small : styles.big]}
      onPress={onPress}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  small: {
    height: 24,
    width: 70,
    borderRadius: 12,
  },
  big: {
    height: 50,
    width: 335,
    borderRadius: 25,
  },
  text: {
    color: '#183CB0',
    fontWeight: 'bold',
  },
});

WhiteButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  small: PropTypes.bool.isRequired,
};

export default WhiteButton;
