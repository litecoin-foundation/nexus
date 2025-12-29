import React, {
  useEffect,
  useContext,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useTranslation} from 'react-i18next';

import BiometricButton from './BiometricButton';
import {inputValue, backspaceValue, clearValues} from '../../reducers/authpad';
import {unlockWalletWithBiometric} from '../../reducers/authentication';
import {authenticate} from '../../utils/biometric';
import PasscodeInput from '../PasscodeInput';
import PadGrid from './PadGrid';
import BuyButton from './BuyButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

const MAX_LOGIN_ATTEMPTS = 10;
const TIME_LOCK_IN_SEC = 3600;
const DAY_LOCK_IN_SEC = 86400;

interface Props {
  handleValidationFailure: () => void;
  handleValidationSuccess: () => void;
  handleBiometricPress?: () => void;
  keychainPincodeState?: string | null;
}

interface PasscodeInputRef {
  playIncorrectAnimation: () => void;
}

const AuthPad: React.FC<Props> = props => {
  const {
    handleValidationFailure,
    handleValidationSuccess,
    handleBiometricPress,
    keychainPincodeState,
  } = props;

  const {t} = useTranslation('onboarding');

  const dispatch = useAppDispatch();
  const pin = useAppSelector(state => state.authpad.pin);
  const passcode = useAppSelector(state => state.authentication.passcode);

  const failedLoginAttempts = useAppSelector(
    state => state.authentication.failedLoginAttempts,
  );
  const timeLock = useAppSelector(state => state.authentication.timeLock);
  const timeLockAt = useAppSelector(state => state.authentication.timeLockAt);
  const dayLock = useAppSelector(state => state.authentication.dayLock);
  const dayLockAt = useAppSelector(state => state.authentication.dayLockAt);
  const permaLock = useAppSelector(state => state.authentication.permaLock);

  const passcodeInputRef = useRef<PasscodeInputRef>(null);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // clear all inputs in AuthPad on initial render
  useEffect(() => {
    dispatch(clearValues());
  }, [dispatch]);

  useEffect(() => {
    return function cleanup() {
      dispatch(clearValues());
    };
  }, [dispatch]);

  const [pinInactive, setPinInactive] = useState(false);
  // handles when AuthPad inputs are filled
  useEffect(() => {
    if (pin.length === 6) {
      setPinInactive(true);
      if (keychainPincodeState && keychainPincodeState === pin) {
        handleValidationSuccess();
      } else if (pin === passcode) {
        handleValidationSuccess();
      } else {
        passcodeInputRef.current?.playIncorrectAnimation();
        handleValidationFailure();
        dispatch(clearValues());
        setPinInactive(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, passcode]);

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

  const getStatus = useCallback(() => {
    if (permaLock) {
      setPinInactive(true);
      return 'Maxed out pin attempts. Recover with seed.';
    } else if (dayLock) {
      if (
        Number(dayLockAt || 0) + DAY_LOCK_IN_SEC <
        Math.floor(Date.now() / 1000)
      ) {
        setPinInactive(false);
        if (failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 3) {
          return t('attempts_left', {
            count: MAX_LOGIN_ATTEMPTS - failedLoginAttempts,
          });
        }
      } else {
        setPinInactive(true);
        const timeLeftInSec =
          DAY_LOCK_IN_SEC - (Math.floor(Date.now() / 1000) - dayLockAt);
        return `Maxed out pin attempts. Try again in ${Math.ceil(
          timeLeftInSec / 60,
        )} minutes.`;
      }
    } else if (timeLock) {
      if (
        Number(timeLockAt || 0) + TIME_LOCK_IN_SEC <
        Math.floor(Date.now() / 1000)
      ) {
        setPinInactive(false);
        if (failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 3) {
          return t('attempts_left', {
            count: MAX_LOGIN_ATTEMPTS - failedLoginAttempts,
          });
        }
      } else {
        setPinInactive(true);
        const timeLeftInSec =
          TIME_LOCK_IN_SEC - (Math.floor(Date.now() / 1000) - timeLockAt);
        return `Maxed out pin attempts. Try again in ${Math.ceil(
          timeLeftInSec / 60,
        )} minutes.`;
      }
    } else {
      setPinInactive(false);
      if (failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 3) {
        return t('attempts_left', {
          count: MAX_LOGIN_ATTEMPTS - failedLoginAttempts,
        });
      }
    }
    return '';
  }, [
    timeLock,
    timeLockAt,
    dayLock,
    dayLockAt,
    permaLock,
    failedLoginAttempts,
    t,
  ]);

  const [status, setStatus] = useState('');
  useLayoutEffect(() => {
    setStatus(getStatus());
  }, [getStatus]);

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const buttons = values.map(value => {
    if (value === '.') {
      return (
        <BiometricButton
          disabled={pinInactive}
          key="biometric-button-key"
          onPress={async () => {
            if (handleBiometricPress) {
              await authenticate('Unlock Wallet');
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
          disabled={pinInactive}
          key="back-arrow-button-key"
          value={value}
          onPress={() => handlePress(value)}
          imageSource={require('../../assets/icons/back-arrow.png')}
        />
      );
    }
    return (
      <BuyButton
        disabled={pinInactive}
        key={value}
        value={value}
        onPress={() => handlePress(value)}
      />
    );
  });

  const RenderStatusText = (
    <Text style={styles.bottomSheetStatus}>{status}</Text>
  );

  return (
    <View style={styles.bottomSheet}>
      <TranslateText
        textKey={'enter_pin'}
        domain={'onboarding'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.03}
        maxLengthInPixels={SCREEN_WIDTH}
        textStyle={styles.bottomSheetTitle}
        numberOfLines={1}
      />
      {RenderStatusText}
      <View style={styles.bottomSheetSubContainer}>
        <PasscodeInput
          pinInactive={pinInactive}
          dotsLength={6}
          activeDotIndex={pin.length}
          ref={passcodeInputRef}
        />
        <PadGrid />
        <View style={styles.buttonContainer}>{buttons}</View>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#ffffff',
      borderTopLeftRadius: screenHeight * 0.03,
      borderTopRightRadius: screenHeight * 0.03,
      width: screenWidth,
      height: screenHeight * 0.65,
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
    bottomSheetStatus: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      color: 'red',
      fontSize: screenHeight * 0.015,
      fontWeight: 300,
      textAlign: 'center',
      paddingTop: screenHeight * 0.01,
    },
    bottomSheetSubContainer: {
      paddingTop: screenHeight * 0.01,
    },
    buttonContainer: {
      width: screenWidth,
      height: screenHeight * 0.4,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
    },
  });

export default AuthPad;
