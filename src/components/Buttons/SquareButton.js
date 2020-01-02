import React from 'react';
import {Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import PropTypes from 'prop-types';

const SquareButton = props => {
  const {value, onPress, imageSource} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={imageSource} style={styles.image} />
      <Text style={styles.text}>{value}</Text>
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
    shadowColor: 'rgba(82,84,103,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 1,
    shadowOffset: {
      height: 6,
      width: 0,
    },
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.32,
    position: 'absolute',
    bottom: 10,
    marginTop: 30,
  },
  image: {top: -10},
});

SquareButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default SquareButton;
