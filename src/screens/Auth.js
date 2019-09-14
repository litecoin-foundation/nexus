import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import Auth from '../components/Auth';
import {clearValues} from '../reducers/authpad';
import {unlockWalletWithPin, clearWalletUnlocked} from '../reducers/lightning';

const Pin = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();
  const pin = useSelector(state => state.authpad.pin);
  const walletUnlocked = useSelector(state => state.lightning.walletUnlocked);

  useEffect(() => {
    if (pin.length === 6) {
      const checkPincode = async () => {
        await dispatch(unlockWalletWithPin(pin));
        await dispatch(clearValues());

        if (walletUnlocked === null) {
          return;
        } else if (walletUnlocked === false) {
          alert('incorrect pincode');
          await dispatch(clearWalletUnlocked());
        } else {
          navigate('App');
        }
      };
      checkPincode();
    }
  });

  return (
    <Auth
      headerTitleText="Unlock Wallet"
      headerDescriptionText="Use your PIN to unlock your Wallet"
    />
  );
};

Pin.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

export default Pin;
