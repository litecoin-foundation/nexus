import React, {useEffect} from 'react';
import {Alert, View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Auth from '../../components/Auth';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {
  unlockWalletWithPin,
  clearWalletUnlocked,
  unlockWalletWithBiometric,
} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';

const AuthScreen = (props) => {
  const dispatch = useDispatch();

  const pin = useSelector((state) => state.authpad.pin);
  const biometricsEnabled = useSelector(
    (state) => state.authentication.biometricsEnabled,
  );
  const walletUnlocked = useSelector(
    (state) => state.authentication.walletUnlocked,
  );

  useEffect(() => {
    if (biometricsEnabled) {
      dispatch(unlockWalletWithBiometric());
    }
  }, [biometricsEnabled, dispatch]);

  useEffect(() => {
    const clear = async () => {
      await dispatch(clearWalletUnlocked());
    };

    switch (walletUnlocked) {
      case false:
        clear();
        break;
      case true:
        props.navigation.replace('AppStack');
        clear();
        break;
      default:
        return;
    }
  });

  const unlockWallet = async () => {
    await dispatch(unlockWalletWithPin(pin));
    await dispatch(clearValues());
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

const styles = StyleSheet.create({
  headerRight: {
    paddingRight: 18,
  },
});

AuthScreen.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Unlock Wallet',
    headerRight: () => (
      <View style={styles.headerRight}>
        <WhiteButton
          value="FORGOT?"
          small={true}
          onPress={() => navigation.navigate('Forgot')}
          active={true}
        />
      </View>
    ),
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default AuthScreen;
