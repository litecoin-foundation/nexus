import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

const BlueClearWhiteButton = (props) => {
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
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  text: {
    fontSize: 15,
    color: 'white',
    letterSpacing: 0.1,
  },
});

export default BlueClearWhiteButton;
