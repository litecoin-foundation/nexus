import React, {useState, useLayoutEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {HeaderBackButton} from '@react-navigation/elements';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';

const Pin = (props) => {
  const dispatch = useDispatch();
  const {navigation} = props;

  useLayoutEffect(() => {
    const handleBackNavigation = () => {
      dispatch(resetPincode());
      navigation.goBack();
    };

    navigation.setOptions({
      headerTransparent: true,
      headerBackTitleVisible: false,
      headerTintColor: 'white',
      headerLeft: () => (
        <HeaderBackButton
          tintColor="white"
          labelVisible={false}
          onPress={() => handleBackNavigation()}
        />
      ),
    });
  }, [dispatch, navigation]);

  const pin = useSelector((state) => state.authpad.pin);
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeInitialSet, setPasscodeInitialSet] = useState(false);
  const beingRecovered = useSelector(
    (state) => state.onboarding.beingRecovered,
  );

  navigation.setOptions({
    headerTitle: passcodeInitialSet
      ? 'Verify your Passcode'
      : 'Create a Passcode',
  });

  const handleCompletion = () => {
    setNewPasscode(pin);
    setPasscodeInitialSet(true);
    dispatch(clearValues());
  };

  const handleValidationSuccess = () => {
    dispatch(addPincode(newPasscode));
    handleNavigation(beingRecovered, navigation.navigate);
  };

  const handleValidationFailure = () => {
    dispatch(resetPincode());
    navigation.pop(1);
  };

  const handleNavigation = (beingRecovered) => {
    if (!beingRecovered) {
      navigation.navigate('Generate');
    } else {
      navigation.navigate('ChannelBackup');
    }
  };

  return (
    <OnboardingAuthPad
      headerDescriptionText={
        passcodeInitialSet
          ? 'Enter your passcode again.'
          : 'Please enter a secure passcode'
      }
      handleCompletion={handleCompletion}
      handleValidationFailure={handleValidationFailure}
      handleValidationSuccess={handleValidationSuccess}
      newPasscode={newPasscode}
      passcodeInitialSet={passcodeInitialSet}
    />
  );
};

export default Pin;
