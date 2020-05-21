import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

const BlueFatButton = (props) => {
  const {value, onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#2C72FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(68,130,255)',
    shadowOpacity: 0.41,
    shadowRadius: 6,
    elevation: 6,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  text: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default BlueFatButton;
