import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from 'react-navigation-hooks';

import Auth from '../components/Auth';
import {clearValues} from '../reducers/authpad';
import {unlockWallet} from '../reducers/lightning';

const Pin = () => {
  const dispatch = useDispatch();
  const {navigate} = useNavigation();
  const pin = useSelector(state => state.authpad.pin);
  const passcode = useSelector(state => state.onboarding.passcode);

  useEffect(() => {
    if (pin.length === 6) {
      dispatch(clearValues());
      dispatch(unlockWallet(pin));

      if (pin !== passcode) {
        alert('incorrect');
      } else {
        navigate('App');
      }
    }
  });

  return (
    <View>
      <Auth
        headerTitleText="Unlock Wallet"
        headerDescriptionText="Use your PIN to unlock your Wallet"
      />
    </View>
  );
};

Pin.navigationOptions = {
  headerTransparent: true,
  headerBackTitle: null,
};

export default Pin;
