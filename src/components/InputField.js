import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const InputField = (props) => {
  const {value, onChangeText, placeholder} = props;
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ? placeholder : 'description'}
        style={styles.text}
        onChangeText={(text) => onChangeText(text)}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 0,
    paddingLeft: 20,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'center',
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
    color: 'rgba(74, 74, 74, 1)',
  },
});

export default InputField;
