import React, {useState, useLayoutEffect, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';

import Auth from '../../components/Auth';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {addPincode} from '../../reducers/authentication';
import {
  resetPincode,
  resetSeed,
  addUpRecoverPinFail,
} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getItem} from '../../utils/keychain';
import {resetToLoading} from '../../navigation/NavigationService';

type RootStackParamList = {
  RecoverPin: undefined;
  Generate: undefined;
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'RecoverPin'>;
}

const RecoverPin: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const {biometricsAvailable, failedRecoverPinAttempts} = useAppSelector(
    state => state.authentication,
  );

  const [keychainPincodeState, setKeychainPincodeState] = useState<
    string | null
  >('');

  useLayoutEffect(() => {
    const setKeychainPincode = async () => {
      const keychainPincode = await getItem('PINCODE');
      setKeychainPincodeState(keychainPincode);
    };
    setKeychainPincode();
  }, []);

  const pin = useAppSelector(state => state.authpad.pin);

  const handleValidationSuccess = () => {
    dispatch(addPincode(pin));
    handleNavigation();
  };

  const handleValidationFailure = () => {
    dispatch(addUpRecoverPinFail());
  };

  useEffect(() => {
    // erase seed and pin from keychain on third fail
    if (failedRecoverPinAttempts > 2) {
      const resetWallet = async () => {
        try {
          await Promise.all([dispatch(resetPincode()), dispatch(resetSeed())]);
        } catch (error) {
          console.error('Failed to reset wallet:', error);
        } finally {
          resetToLoading();
        }
      };
      resetWallet();
    }
  }, [failedRecoverPinAttempts, dispatch]);

  const handleNavigation = () => {
    if (biometricsAvailable) {
      navigation.navigate('Biometric');
    } else {
      navigation.navigate('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      <Auth
        handleValidationSuccess={handleValidationSuccess}
        handleValidationFailure={handleValidationFailure}
        keychainPincodeState={keychainPincodeState}
      />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="recover_pin"
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

export default RecoverPin;
