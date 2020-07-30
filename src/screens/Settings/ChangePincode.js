import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Pagination} from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';

import Pad from '../../components/Numpad/Pad';
import Header from '../../components/Header';
import {addPincode} from '../../reducers/authentication';
import {setItem} from '../../lib/utils/keychain';

const ChangePincode = (props) => {
  const {navigation, route} = props;
  const dispatch = useDispatch();
  const pin = useSelector((state) => state.authentication.passcode);

  const [currentPin, setCurrentPin] = useState(
    route.params.type === 'RESET' ? false : true,
  );
  const [newPin, setNewPin] = useState(
    route.params.type === 'RESET' ? true : false,
  );
  const [repeatPin, setRepeatPin] = useState(false);
  const [newPinCodeValue, setNewPinCodeValue] = useState('');
  const [padValue, setPadValue] = useState('');

  const handleInput = (pincode) => {
    if (padValue.length === 5) {
      handleCompletion(pincode);
    } else {
      setPadValue(pincode);
    }
  };

  const handleCompletion = (passcodeAttempt) => {
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
        <Pagination
          dotStyle={styles.dotStyle}
          inactiveDotColor="#2C72FF"
          dotColor="#2C72FF"
          dotsLength={6}
          activeDotIndex={padValue.length - 1}
        />
      </View>

      <LinearGradient style={styles.flex} colors={['#F2F8FD', '#d2e1ef00']}>
        <Pad
          currentValue={padValue}
          onChange={(value) => handleInput(value)}
          maxLength={6}
          dotDisabled={true}
          noBackgroundColor={true}
        />
      </LinearGradient>
    </View>
  );
};

async function setPincodeToKeychain(pin) {
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

ChangePincode.navigationOptions = () => {
  return {
    headerTitle: 'Change Wallet PIN',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default ChangePincode;
