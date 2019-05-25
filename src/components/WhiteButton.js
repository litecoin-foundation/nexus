import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const WhiteButton = props => {
  const { value, onPress } = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 24,
    width: 70,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      height: 0,
      width: 0
    },
    marginRight: 20
  },
  text: {
    color: '#183CB0',
    fontWeight: 'bold'
  }
});

WhiteButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

export default WhiteButton;
