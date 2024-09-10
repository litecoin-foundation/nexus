import React, {useState, useLayoutEffect, useEffect} from 'react';
import {StackNavigationProp} from '@react-navigation/stack';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {Platform, StyleSheet, Text} from 'react-native';

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
      headerTitleAlign: 'left',
      headerTintColor: 'white',
      headerLeft: () => (
        <HeaderButton
          onPress={() => handleBackNavigation()}
          imageSource={require('../../assets/images/back-icon.png')}
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

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          {passcodeInitialSet ? 'Verify your Passcode' : 'Create Passcode'}
        </Text>
      ),
    });
  }, [passcodeInitialSet]);

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
          : 'Please create a secure passcode.'
      }
      handleCompletion={handleCompletion}
      handleValidationFailure={handleValidationFailure}
      handleValidationSuccess={handleValidationSuccess}
      newPasscode={newPasscode}
      passcodeInitialSet={passcodeInitialSet}
    />
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 22,
  },
});

export default Pin;
