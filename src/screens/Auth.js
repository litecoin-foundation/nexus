import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import Auth from '../components/Auth';
import {clearValues} from '../reducers/authpad';
import {
  unlockWalletWithPin,
  clearWalletUnlocked,
  unlockWalletWithBiometric,
} from '../reducers/authentication';

const Pin = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();

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
      navigate('App');
    }
  });

  const unlockWallet = async () => {
    await dispatch(clearValues());
    await dispatch(unlockWalletWithPin(pin));
  };

  const handleValidationFailure = () => {
    alert('incorrect pincode');
  };

  return (
    <Auth
      headerTitleText="Unlock Wallet"
      headerDescriptionText="Use your PIN to unlock your Wallet"
      handleValidationSuccess={unlockWallet}
      handleValidationFailure={handleValidationFailure}
    />
  );
};

Pin.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

export default Pin;
