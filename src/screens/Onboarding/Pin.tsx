import React, {useState, useEffect, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';
import {resetSeedAction} from '../../reducers/onboarding';
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

  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeInitialSet, setPasscodeInitialSet] = useState(false);
  const {pin} = useAppSelector(state => state.authpad!);
  const {beingRecovered} = useAppSelector(state => state.onboarding!);
  const {biometricsAvailable} = useAppSelector(state => state.authentication!);

  useFocusEffect(
    useCallback(() => {
      setNewPasscode('');
      setPasscodeInitialSet(false);
      dispatch(clearValues());
    }, [dispatch]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      // Only reset if going back, not when navigating forward
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        dispatch(resetPincode());
        if (beingRecovered) {
          dispatch(resetSeedAction());
        }
      }
    });

    return unsubscribe;
  }, [navigation, dispatch, beingRecovered]);

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
    <View style={styles.container}>
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
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey={passcodeInitialSet ? 'verify_pin' : 'create_pin'}
        titleDomain="onboarding"
        fadeStyle={headerFadeStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Pin;
