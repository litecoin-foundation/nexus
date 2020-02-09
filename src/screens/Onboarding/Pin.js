import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {HeaderBackButton} from '@react-navigation/stack';

import Auth from '../../components/Auth';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {setItem} from '../../lib/utils/keychain';

const Pin = props => {
  const dispatch = useDispatch();
  const pin = useSelector(state => state.authpad.pin);
  const passcodeSet = useSelector(state => state.authentication.passcodeSet);
  const beingRecovered = useSelector(state => state.onboarding.beingRecovered);

  props.navigation.setOptions({
    headerTitle: passcodeSet ? 'Verify your Passcode' : 'Create a Passcode',
  });

  const handleCompletion = () => {
    dispatch(addPincode(pin));
    dispatch(clearValues());
  };

  const handleValidationSuccess = () => {
    setPincodeToKeychain(pin);
    handleNavigation(beingRecovered, props.navigation.navigate);
  };

  const handleValidationFailure = () => {
    props.navigation.navigate('Loading');
  };

  return (
    <Auth
      headerDescriptionText={
        passcodeSet
          ? 'Enter your passcode again.'
          : 'Please enter a secure passcode'
      }
      handleCompletion={handleCompletion}
      handleValidationFailure={handleValidationFailure}
      handleValidationSuccess={handleValidationSuccess}
    />
  );
};

const handleNavigation = (beingRecovered, navigate) => {
  if (!beingRecovered) {
    navigate('Generate');
  } else {
    navigate('ChannelBackup');
  }
};

async function setPincodeToKeychain(pin) {
  await setItem('PINCODE', pin);
}

Pin.navigationOptions = ({navigation}) => {
  return {
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderBackButton
        tintColor="white"
        labelVisible={false}
        onPress={() => navigation.goBack()}
      />
    ),
  };
};

export default Pin;
