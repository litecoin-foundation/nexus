import React from 'react';
import { View, TextInput } from 'react-native';

const GreyTextInput = props => {
  const { placeholder, onChangeText } = props;
  return (
    <View
      style={{
        height: 50,
        borderRadius: 5,
        paddingLeft: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0
        }
      }}
    >
      <TextInput placeholder={placeholder} onChangeText={onChangeText} />
    </View>
  );
};

export default GreyTextInput;
