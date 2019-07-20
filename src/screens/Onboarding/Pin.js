import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';

import Auth from '../../components/Auth';
import { addPincode } from '../../reducers/onboarding';
import { clearValues } from '../../reducers/authpad';

const Pin = () => {
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const pin = useSelector(state => state.authpad.pin);
  const passcodeSet = useSelector(state => state.onboarding.passcodeSet);
  const passcode = useSelector(state => state.onboarding.passcode);
  const beingRecovered = useSelector(state => state.onboarding.beingRecovered);

  useEffect(() => {
    if (pin.length === 6) {
      dispatch(addPincode(pin));
      dispatch(clearValues());
    }
  });

  useEffect(() => {
    const handleNavigation = () => {
      if (!beingRecovered) {
        navigate('Generate');
      } else {
        navigate('ChannelBackup');
      }
    };

    if (pin.length === 6 && passcodeSet === true) {
      dispatch(clearValues());

      if (pin === passcode) {
        handleNavigation();
      } else {
        navigate('Loading');
      }
    }
  }, [beingRecovered, dispatch, navigate, passcode, passcodeSet, pin]);

  return (
    <Auth
      headerTitleText={passcodeSet ? `Verify your Passcode` : `Create a Passcode`}
      headerDescriptionText={
        passcodeSet ? `Enter your passcode again.` : `Please enter a secure passcode`
      }
    />
  );
};

Pin.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null
};

export default Pin;
