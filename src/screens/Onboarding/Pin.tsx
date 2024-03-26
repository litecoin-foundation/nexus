import React, {useState, useLayoutEffect} from 'react';
import {HeaderBackButton} from '@react-navigation/elements';
import {StackNavigationProp} from '@react-navigation/stack';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Pin: undefined;
  Generate: undefined;
  ChannelBackup: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Pin'>;
}

const Pin: React.FC<Props> = props => {
  const dispatch = useAppDispatch();
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

  const pin = useAppSelector(state => state.authpad.pin);
  const beingRecovered = useAppSelector(
    state => state.onboarding.beingRecovered,
  );
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeInitialSet, setPasscodeInitialSet] = useState(false);

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
    handleNavigation();
  };

  const handleValidationFailure = () => {
    dispatch(resetPincode());
    navigation.pop(1);
  };

  const handleNavigation = () => {
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
