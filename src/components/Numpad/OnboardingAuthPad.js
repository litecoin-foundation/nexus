// TODO: cleanup needed
import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Pagination} from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';

import Button from './Button';
import BiometricButton from './BiometricButton';
import OnboardingHeader from '../OnboardingHeader';
import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {unlockWalletWithBiometric} from '../../reducers/authentication';

const AuthPad = (props) => {
  const {
    handleCompletion,
    handleValidationFailure,
    handleValidationSuccess,
    passcodeInitialSet,
    newPasscode,
    headerDescriptionText,
  } = props;
  const dispatch = useDispatch();

  const pin = useSelector((state) => state.authpad.pin);
  const passcodeSet = useSelector((state) => state.authentication.passcodeSet);

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
    if (
      pin.length === 6 &&
      passcodeSet === false &&
      passcodeInitialSet === false
    ) {
      // runs when no initial passcode set yet
      handleCompletion();
      clear();
    } else if (
      (pin.length === 6 && passcodeSet === true) ||
      (pin.length === 6 && passcodeInitialSet === true)
    ) {
      // runs when initial passcode is set

      if (pin === newPasscode) {
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
    newPasscode,
    passcodeInitialSet,
    passcodeSet,
    pin,
  ]);

  const handlePress = (input) => {
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

  const buttons = values.map((value) => {
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
    <View style={styles.container}>
      <OnboardingHeader description={headerDescriptionText}>
        <Pagination
          dotStyle={styles.dotStyle}
          inactiveDotColor="#FFFFFF36"
          dotColor="white"
          dotsLength={6}
          activeDotIndex={pin.length - 1}
        />
      </OnboardingHeader>
      <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.gradient}>
        <View style={styles.buttonContainer}>
          <View style={styles.area}>{buttons}</View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  gradient: {
    flexGrow: 1,
  },
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
  dotStyle: {
    width: 9,
    height: 9,
    borderRadius: 9 / 2,
    marginHorizontal: 5,
  },
});

export default AuthPad;
