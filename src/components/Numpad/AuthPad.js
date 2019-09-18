import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';

import Button from './Button';
import BiometricButton from './BiometricButton';
import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {unlockWalletWithBiometric} from '../../reducers/authentication';

const AuthPad = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const clear = async () => {
      await dispatch(clearValues());
    };
    clear();
  }, [dispatch]);

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
    if (value === '.') {
      return (
        <BiometricButton
          key="biometric-button-key"
          onPress={() => dispatch(unlockWalletWithBiometric())}
        />
      );
    }
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
    flex: 1,
    justifyContent: 'center',
  },
  area: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    alignSelf: 'center',
  },
});

export default AuthPad;
