import React, {useEffect} from 'react';
import {View, StyleSheet, Text, Platform, Dimensions} from 'react-native';

import BiometricButton from './BiometricButton';
import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {unlockWalletWithBiometric} from '../../reducers/authentication';
import {authenticate} from '../../lib/utils/biometric';
import PasscodeInput from '../PasscodeInput';
import PadGrid from './PadGrid';
import BuyButton from './BuyButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

const screenHeight = Dimensions.get('screen').height;

interface Props {
  handleValidationFailure: () => void;
  handleValidationSuccess: () => void;
  handleBiometricPress: () => void;
}

const AuthPad: React.FC<Props> = props => {
  const {
    handleValidationFailure,
    handleValidationSuccess,
    handleBiometricPress,
  } = props;
  const dispatch = useAppDispatch();
  const pin = useAppSelector(state => state.authpad.pin);
  const passcode = useAppSelector(state => state.authentication.passcode);

  // clear all inputs in AuthPad on initial render
  useEffect(() => {
    dispatch(clearValues());
  }, [dispatch]);

  useEffect(() => {
    return function cleanup() {
      dispatch(clearValues());
    };
  }, [dispatch]);

  // handles when AuthPad inputs are filled
  useEffect(() => {
    if (pin.length === 6) {
      if (pin === passcode) {
        handleValidationSuccess();
      } else {
        handleValidationFailure();
        dispatch(clearValues());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handlePress = (input: string) => {
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
          onPress={async () => {
            if (handleBiometricPress) {
              await authenticate();
              handleBiometricPress();
            } else {
              dispatch(unlockWalletWithBiometric());
            }
          }}
        />
      );
    }
    if (value === '⌫') {
      return (
        <BuyButton
          key="back-arrow-button-key"
          value={value}
          onPress={() => handlePress(value)}
          imageSource={require('../../assets/icons/back-arrow.png')}
        />
      );
    }
    return (
      <BuyButton key={value} value={value} onPress={() => handlePress(value)} />
    );
  });

  return (
    <View style={styles.bottomSheet}>
      <Text style={styles.bottomSheetTitle}>Enter your PIN</Text>

      <View style={styles.bottomSheetSubContainer}>
        <PasscodeInput dotsLength={6} activeDotIndex={pin.length} />
        <PadGrid />
        <View style={styles.buttonContainer}>{buttons}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheetTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: 'bold',
    color: '#2e2e2e',
    fontSize: 26,
    textAlign: 'center',
    paddingTop: 18,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 470 / screenHeight > 0.51 ? '83%' : '70%',
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
  bottomSheetSubContainer: {
    position: 'absolute',
    bottom: 470 / screenHeight > 0.51 ? 20 : 100,
  },
  buttonContainer: {
    height: 390,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 20,
  },
});

export default AuthPad;
