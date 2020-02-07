import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import Auth from '../../components/Auth';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {setItem} from '../../lib/utils/keychain';

const Pin = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();
  const pin = useSelector(state => state.authpad.pin);
  const passcodeSet = useSelector(state => state.authentication.passcodeSet);
  const beingRecovered = useSelector(state => state.onboarding.beingRecovered);

  const handleCompletion = () => {
    dispatch(addPincode(pin));
    dispatch(clearValues());
  };

  const handleValidationSuccess = () => {
    setPincodeToKeychain(pin);
    handleNavigation(beingRecovered, navigate);
  };

  const handleValidationFailure = () => {
    navigate('Loading');
  };

  return (
    <Auth
      headerTitleText={
        passcodeSet ? 'Verify your Passcode' : 'Create a Passcode'
      }
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

Pin.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

export default Pin;
