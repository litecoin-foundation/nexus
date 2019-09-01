import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';

import Button from './Button';
import {inputValue, backspaceValue} from '../../reducers/authpad';

const AuthPad = () => {
  const dispatch = useDispatch();

  const handlePress = input => {
    switch (input) {
      case '.':
        // TODO: biometric login flow
        break;
      case '⌫':
        dispatch(backspaceValue());
        break;
      default:
        dispatch(inputValue(input));
        break;
    }
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const buttons = values.map(value => {
    return (
      <Button key={value} value={value} onPress={() => handlePress(value)} />
    );
  });

  return (
    <View style={styles.buttonContainer}>
      <View style={styles.area}>{buttons}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 450,
    backgroundColor: 'transparent',
    justifyContent: 'space-evenly',
    flexGrow: 1,
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    alignSelf: 'center',
  },
});

export default AuthPad;
