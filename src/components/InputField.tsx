import React from 'react';
import {View, TextInput, StyleSheet, Platform} from 'react-native';

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
}

const InputField: React.FC<Props> = props => {
  const {value, onChangeText, placeholder} = props;
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ? placeholder : undefined}
        placeholderTextColor="#dbdbdb"
        style={styles.text}
        onChangeText={text => onChangeText(text)}
        value={value}
        autoCorrect={false}
        autoComplete="off"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  text: {
    paddingLeft: 11.5,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
  },
});

export default InputField;
