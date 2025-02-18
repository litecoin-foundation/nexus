import React, {useState, useLayoutEffect, useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Pin: undefined;
  Generate: undefined;
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Pin'>;
}

const Pin: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const biometricsAvailable = useAppSelector(
    state => state.authentication.biometricsAvailable,
  );

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
        <TranslateText
          textKey={passcodeInitialSet ? 'verify_pin' : 'create_pin'}
          domain="onboarding"
          textStyle={styles.headerTitle}
        />
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
      if (biometricsAvailable) {
        navigation.navigate('Biometric');
      } else {
        navigation.navigate('Welcome');
      }
    }
  };

  return (
    <OnboardingAuthPad
      headerDescriptionText={
        passcodeInitialSet
          ? t('create_pin_repeat')
          : t('create_pin_description')
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
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 22,
  },
});

export default Pin;
