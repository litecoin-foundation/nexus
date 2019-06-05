import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const InputField = () => {
  return (
    <View style={styles.container}>
      <TextInput placeholder="enter a description" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: 65,
    borderRadius: 7,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0
    }
  }
});

export default InputField;
