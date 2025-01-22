import React, {useContext, useLayoutEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {addPincode} from '../../reducers/authentication';
import {setItem} from '../../lib/utils/keychain';
import PasscodeInput from '../../components/PasscodeInput';
import PadGrid from '../../components/Numpad/PadGrid';
import BuyButton from '../../components/Numpad/BuyButton';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  route: any; // TODO
}

interface PasscodeInputRef {
  playIncorrectAnimation: () => void;
}

const ChangePincode: React.FC<Props> = props => {
  const navigation = useNavigation<any>();
  const {route} = props;
  const dispatch = useAppDispatch();
  const pin = useAppSelector(state => state.authentication.passcode);

  const passcodeInputRef = useRef<PasscodeInputRef>(null);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTransparent: true,
      headerTintColor: 'white',
      headerLeft: () => (
        <HeaderButton
          onPress={() => navigation.goBack()}
          imageSource={require('../../assets/images/back-icon.png')}
        />
      ),
      headerTitle: () => (
        <Text style={styles.headerTitle}>Change Login Pincode</Text>
      ),
    });
  });

  const [currentPin, setCurrentPin] = useState(
    route.params.type === 'RESET' ? false : true,
  );
  const [newPin, setNewPin] = useState(
    route.params.type === 'RESET' ? true : false,
  );
  const [repeatPin, setRepeatPin] = useState(false);
  const [newPinCodeValue, setNewPinCodeValue] = useState('');
  const [padValue, setPadValue] = useState('');

  const handleInput = (pincode: string) => {
    if (padValue.length === 5) {
      const value = padValue + pincode;
      handleCompletion(value);
    } else {
      const value = padValue + pincode;
      setPadValue(value);
    }
  };

  const handleCompletion = (value: string) => {
    setPadValue('');
    if (currentPin) {
      if (value === pin) {
        setCurrentPin(false);
        setNewPin(true);
      } else {
        // incorrect current pin entered
        passcodeInputRef.current?.playIncorrectAnimation();
        setCurrentPin(true);
        setNewPin(false);
        return;
      }
    } else if (newPin) {
      // new pin
      setNewPinCodeValue(value);
      setNewPin(false);
      setRepeatPin(true);
    } else if (repeatPin) {
      // new pin reentry
      if (value === newPinCodeValue) {
        dispatch(addPincode(newPinCodeValue));
        setPincodeToKeychain(newPinCodeValue);
        Alert.alert(
          'Success',
          'Successfully reset PIN!',
          [
            {
              text: 'OK',
              onPress: () =>
                route.params.type === 'RESET'
                  ? navigation.pop(2)
                  : navigation.goBack(),
            },
          ],
          {cancelable: false},
        );
      } else {
        setRepeatPin(false);
        setNewPin(true);
        setNewPinCodeValue('');
        Alert.alert(
          'Invalid',
          'Pincodes did not match. Try again.',
          [{text: 'Cancel', onPress: () => navigation.goBack()}, {text: 'OK'}],
          {
            cancelable: false,
          },
        );
      }
    }
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const buttons = values.map(value => {
    if (value === '.') {
      return <View style={styles.emptyBuyButton} />;
    }
    if (value === '⌫') {
      return (
        <BuyButton
          disabled={false}
          key="back-arrow-button-key"
          value={value}
          onPress={() => {
            const padVal = padValue.slice(0, -1);
            setPadValue(padVal);
          }}
          imageSource={require('../../assets/icons/back-arrow.png')}
        />
      );
    }
    return (
      <BuyButton
        disabled={false}
        key={value}
        value={value}
        onPress={() => handleInput(value)}
      />
    );
  });

  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>
          {currentPin
            ? 'Enter your Old PIN'
            : newPin
            ? 'Enter a New PIN'
            : 'Repeat your New PIN'}
        </Text>

        <PasscodeInput
          dotsLength={6}
          activeDotIndex={padValue.length}
          pinInactive={false}
          ref={passcodeInputRef}
        />
        <PadGrid />
        <View style={styles.buttonContainer}>{buttons}</View>
      </View>
    </LinearGradient>
  );
};

async function setPincodeToKeychain(pin: string) {
  await setItem('PINCODE', pin);
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
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
      paddingBottom: screenHeight * 0.02,
    },
    text: {
      color: '#2F2F2F',
      fontSize: 20,
      fontWeight: 'bold',
      letterSpacing: -0.46,
    },
    buttonContainer: {
      width: screenWidth,
      height: screenHeight * 0.4,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    emptyBuyButton: {
      width: screenWidth / 3,
      height: screenHeight * 0.1,
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
  });

export default ChangePincode;
