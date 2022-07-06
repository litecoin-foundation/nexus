import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Pad from '../../components/Numpad/Pad';
import Header from '../../components/Header';
import {addPincode} from '../../reducers/authentication';
import {setItem} from '../../lib/utils/keychain';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {useNavigation} from '@react-navigation/native';
import Dots from '../../components/Dots';

interface Props {
  route: any; // TODO
}

const ChangePincode: React.FC<Props> = props => {
  const navigation = useNavigation<any>();
  const {route} = props;
  const dispatch = useAppDispatch();
  const pin = useAppSelector(state => state.authentication.passcode);

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
      handleCompletion(pincode);
    } else {
      setPadValue(pincode);
    }
  };

  const handleCompletion = (passcodeAttempt: string) => {
    setPadValue('');
    if (currentPin) {
      if (passcodeAttempt === pin) {
        setCurrentPin(false);
        setNewPin(true);
      } else {
        setCurrentPin(true);
        setNewPin(false);
        Alert.alert(
          'Incorrect Pin',
          'Failed pincode attempt.',
          [{text: 'OK'}],
          {cancelable: false},
        );
        return;
      }
    } else if (newPin) {
      setNewPinCodeValue(passcodeAttempt);
      setNewPin(false);
      setRepeatPin(true);
    } else if (repeatPin) {
      if (passcodeAttempt === newPinCodeValue) {
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

  return (
    <View style={styles.flex}>
      <Header />
      <View style={styles.pinContainer}>
        <Text style={styles.text}>
          {currentPin
            ? 'Enter your Old PIN'
            : newPin
            ? 'Enter a New PIN'
            : 'Repeat your New PIN'}
        </Text>
        <Dots dotsLength={6} activeDotIndex={padValue.length - 1} />
      </View>

      <LinearGradient style={styles.flex} colors={['#F2F8FD', '#d2e1ef00']}>
        <Pad
          currentValue={padValue}
          onChange={(value: string) => handleInput(value)}
          maxLength={6}
          dotDisabled={true}
          noBackgroundColor={true}
        />
      </LinearGradient>
    </View>
  );
};

async function setPincodeToKeychain(pin: string) {
  await setItem('PINCODE', pin);
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: 'white',
  },
  pinContainer: {
    height: 162,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#2F2F2F',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.46,
  },
});

export default ChangePincode;
