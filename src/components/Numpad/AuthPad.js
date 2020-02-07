import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Button from './Button';
import BiometricButton from './BiometricButton';
import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {unlockWalletWithBiometric} from '../../reducers/authentication';

const AuthPad = props => {
  const {
    handleCompletion,
    handleValidationFailure,
    handleValidationSuccess,
  } = props;
  const dispatch = useDispatch();

  const pin = useSelector(state => state.authpad.pin);
  const passcode = useSelector(state => state.authentication.passcode);
  const passcodeSet = useSelector(state => state.authentication.passcodeSet);

  // clear all inputs in AuthPad on initial render
  useEffect(() => {
    const clear = async () => {
      await dispatch(clearValues());
    };
    clear();
  }, [dispatch]);

  // handles when AuthPad inputs are filled
  useEffect(() => {
    const clear = async () => {
      await dispatch(clearValues());
    };
    if (pin.length === 6 && !passcodeSet) {
      // only runs if wallet does not exist
      handleCompletion();
      clear();
    } else if (pin.length === 6 && passcodeSet) {
      // only runs if wallet exists
      if (pin === passcode) {
        handleValidationSuccess();
        clear();
      } else {
        handleValidationFailure();
        clear();
      }
    }
  }, [
    dispatch,
    handleCompletion,
    handleValidationFailure,
    handleValidationSuccess,
    passcode,
    passcodeSet,
    pin,
  ]);

  const handlePress = input => {
    switch (input) {
      case '.':
        // handled by BiometricButton
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
