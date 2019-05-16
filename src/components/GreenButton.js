import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const GreenButton = props => {
  const { value } = props;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 24,
    width: 70,
    borderRadius: 12,
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
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
});

GreenButton.propTypes = {
  value: PropTypes.string
};

export default GreenButton;
