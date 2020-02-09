import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Auth from '../components/Auth';
import {clearValues} from '../reducers/authpad';
import {
  unlockWalletWithPin,
  clearWalletUnlocked,
  unlockWalletWithBiometric,
} from '../reducers/authentication';

const AuthScreen = props => {
  const dispatch = useDispatch();

  const pin = useSelector(state => state.authpad.pin);
  const biometricsEnabled = useSelector(
    state => state.authentication.biometricsEnabled,
  );
  const walletUnlocked = useSelector(
    state => state.authentication.walletUnlocked,
  );

  useEffect(() => {
    if (biometricsEnabled) {
      dispatch(unlockWalletWithBiometric());
    }
  }, [biometricsEnabled, dispatch]);

  useEffect(() => {
    if (walletUnlocked === null) {
      return;
    } else if (walletUnlocked === false) {
      const clear = async () => {
        await dispatch(clearWalletUnlocked());
      };
      clear();
    } else {
      props.navigation.replace('AppStack');
    }
  });

  const unlockWallet = async () => {
    await dispatch(clearValues());
    await dispatch(unlockWalletWithPin(pin));
  };

  const handleValidationFailure = () => {
    Alert.alert('Incorrect PIN', 'Try Again', [{text: 'OK'}], {
      cancelable: false,
    });
  };

  return (
    <Auth
      headerDescriptionText="Use your PIN to unlock your Wallet"
      handleValidationSuccess={unlockWallet}
      handleValidationFailure={handleValidationFailure}
    />
  );
};

AuthScreen.navigationOptions = () => {
  return {
    headerTitle: 'Unlock Wallet',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    animationEnabled: false,
  };
};

export default AuthScreen;
