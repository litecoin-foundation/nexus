import React, {useEffect, useContext} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import PadGrid from './PadGrid';
import BuyButton from './BuyButton';
import BlueButton from '../Buttons/BlueButton';
import PasscodeInput from '../PasscodeInput';
import OnboardingHeader from '../OnboardingHeader';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
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
  const pin = useAppSelector(state => state.authpad.pin);
  const passcodeSet = useAppSelector(state => state.authentication.passcodeSet);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
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
          disabled={pin.length === 6}
          key="disabled"
          value=""
          onPress={() => console.log('void')}
        />
      );
    }
    if (value === '⌫') {
      return (
        <BuyButton
          disabled={pin.length === 6}
          key="back-arrow-button-key"
          value={value}
          onPress={() => handlePress(value)}
          imageSource={require('../../assets/icons/back-arrow.png')}
        />
      );
    }
    return (
      <BuyButton
        disabled={pin.length === 6}
        key={value}
        value={value}
        onPress={() => handlePress(value)}
      />
    );
  });

  return (
    <LinearGradient style={styles.gradient} colors={['#1162E6', '#0F55C7']}>
      <OnboardingHeader description={headerDescriptionText} />

      <View style={styles.bottomSheet}>
        <TranslateText
          textKey={passcodeInitialSet ? 'reenter_pin' : 'enter_pin'}
          domain={'onboarding'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.027}
          maxLengthInPixels={SCREEN_WIDTH}
          textStyle={styles.bottomSheetTitle}
          numberOfLines={1}
        />

        <View style={styles.bottomSubContainer}>
          <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
            <View style={styles.authContainer}>
              <View style={styles.pinContainer}>
                <PasscodeInput
                  dotsLength={6}
                  activeDotIndex={pin.length}
                  pinInactive={false}
                />
              </View>
              <PadGrid />
              <View style={styles.buttonContainer}>{buttons}</View>
            </View>

            <View style={styles.confirmButtonContainer}>
              <BlueButton
                disabled={pin.length !== 6 ? true : false}
                textKey="confirm_pin"
                textDomain="onboarding"
                onPress={handleSetPin}
              />
            </View>
          </CustomSafeAreaView>
        </View>
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
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
    bottomSubContainer: {
      position: 'absolute',
      left: 0,
      bottom: Platform.OS === 'ios' ? 0 : screenHeight * 0.01,
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
    authContainer: {
      paddingBottom:
        Platform.OS === 'ios' ? screenHeight * 0.02 : screenHeight * 0.01,
    },
    pinContainer: {
      paddingBottom: Platform.OS === 'ios' ? 0 : screenHeight * 0.01,
    },
    confirmButtonContainer: {
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
    buttonContainer: {
      width: screenWidth,
      height: screenHeight * 0.4,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
    },
  });

export default OnboardingAuthPad;
