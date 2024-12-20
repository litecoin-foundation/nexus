import React, {useEffect, useContext} from 'react';
import {View, StyleSheet, Text, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import PadGrid from './PadGrid';
import BuyButton from './BuyButton';
import BlueButton from '../Buttons/BlueButton';
import PasscodeInput from '../PasscodeInput';
import OnboardingHeader from '../OnboardingHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  handleCompletion(): void;
  handleValidationFailure(): void;
  handleValidationSuccess(): void;
  passcodeInitialSet: boolean;
  newPasscode: string;
  headerDescriptionText: string;
}

const OnboardingAuthPad: React.FC<Props> = props => {
  const {
    handleCompletion,
    handleValidationFailure,
    handleValidationSuccess,
    passcodeInitialSet,
    newPasscode,
    headerDescriptionText,
  } = props;

  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const pin = useAppSelector(state => state.authpad.pin);
  const passcodeSet = useAppSelector(state => state.authentication.passcodeSet);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // clear all inputs in AuthPad on initial render
  useEffect(() => {
    const clear = async () => {
      dispatch(clearValues());
    };
    clear();
  }, [dispatch]);

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

  const handleSetPin = () => {
    if (
      pin.length === 6 &&
      passcodeSet === false &&
      passcodeInitialSet === false
    ) {
      // runs when no initial passcode set yet
      handleCompletion();
      dispatch(clearValues());
    } else if (
      (pin.length === 6 && passcodeSet === true) ||
      (pin.length === 6 && passcodeInitialSet === true)
    ) {
      // runs when initial passcode is set
      if (pin === newPasscode) {
        handleValidationSuccess();
        dispatch(clearValues());
      } else {
        handleValidationFailure();
        dispatch(clearValues());
      }
    }
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const buttons = values.map(value => {
    if (value === '.') {
      return (
        <BuyButton
          key="disabled"
          value=""
          onPress={() => console.log('void')}
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
    <>
      <LinearGradient
        style={[
          {flex: 1},
          Platform.OS === 'android' ? {paddingTop: insets.top} : null,
        ]}
        colors={['#1162E6', '#0F55C7']}>
        <OnboardingHeader description={headerDescriptionText} />
      </LinearGradient>

      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>Enter your PIN</Text>

        <View style={styles.bottomSheetSubContainer}>
          <PasscodeInput dotsLength={6} activeDotIndex={pin.length} />
          <PadGrid />
          <View style={styles.buttonContainer}>{buttons}</View>
        </View>

        <View style={styles.confirmButtonContainer}>
          <BlueButton
            disabled={pin.length !== 6 ? true : false}
            value="Confirm PIN"
            onPress={handleSetPin}
          />
        </View>
      </View>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flexGrow: 1,
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#ffffff',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      width: screenWidth,
      height: screenHeight * 0.7,
    },
    confirmButtonContainer: {
      paddingHorizontal: 34,
      position: 'absolute',
      bottom: 28,
      width: '100%',
    },
    bottomSheetTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: '#2e2e2e',
      fontSize: screenHeight * 0.026,
      textAlign: 'center',
      paddingTop: screenHeight * 0.02,
    },
    bottomSheetSubContainer: {
      paddingTop: screenHeight * 0.01,
    },
    buttonContainer: {
      width: screenWidth,
      height: screenHeight * 0.4,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  });

export default OnboardingAuthPad;
