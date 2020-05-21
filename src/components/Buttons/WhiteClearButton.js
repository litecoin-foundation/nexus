import React from 'react';
import {Text, StyleSheet, TouchableOpacity} from 'react-native';

const WhiteClearButton = (props) => {
  const {onPress, value, small, selected} = props;
  return (
    <TouchableOpacity
      style={[
        styles.container,
        small ? styles.smallContainer : null,
        selected ? styles.selectedContainer : null,
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles.text,
          small ? styles.smallText : null,
          selected ? styles.selectedText : null,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: 335,
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    marginTop: 10,
    marginBottom: 10,
  },
  selectedContainer: {
    backgroundColor: 'white',
  },

  smallContainer: {
    height: 50,
    borderRadius: 25,
  },
  text: {
    fontSize: 24,
    color: 'white',
  },
  selectedText: {
    color: '#1341BE',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 15,
  },
});

export default WhiteClearButton;
