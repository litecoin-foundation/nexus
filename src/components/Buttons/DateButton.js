import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const DateButton = props => {
  const {value, isActive} = props;
  return (
    <View>
      <TouchableOpacity
        style={[styles.container, isActive ? styles.active : null]}>
        <Text>{value}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 29,
    width: 73,
    borderRadius: 14.5,
    backgroundColor: 'blue',
  },
  active: {
    backgroundColor: 'purple',
  },
});

export default DateButton;
