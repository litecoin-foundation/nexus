import React, {useEffect, useLayoutEffect} from 'react';
import {StackNavigationProp} from '@react-navigation/stack';
import {WalletState} from 'react-native-nitro-lndltc';

import Auth from '../../components/Auth';
import {
  unlockWalletWithPin,
  clearWalletUnlocked,
  unlockWalletWithBiometric,
} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Auth: undefined;
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
}

const AuthScreen: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const pin = useAppSelector(state => state.authpad!.pin);
  const biometricsEnabled = useAppSelector(
    state => state.authentication!.biometricsEnabled,
  );
  const walletUnlocked = useAppSelector(
    state => state.authentication.walletUnlocked,
  );
  const walletState = useAppSelector(state => state.lightning.walletState);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
    });
  });

  // Presents Biometric authentication on launch
  // If biometricEnabled & wallet is locked, present Biometric auth request
  useEffect(() => {
    if (biometricsEnabled && walletState === WalletState.LOCKED) {
      dispatch(unlockWalletWithBiometric());
    }
  }, [biometricsEnabled, walletState, dispatch]);

  useEffect(() => {
    const clear = async () => {
      dispatch(clearWalletUnlocked());
    };

    switch (walletUnlocked) {
      case false:
        clear();
        break;
      case true:
        navigation.replace('NewWalletStack');
        break;
      default:
        return;
    }
  }, [walletUnlocked]);

  useEffect(() => {
    const clear = async () => {
      dispatch(clearWalletUnlocked());
    };
    return () => {
      clear();
    };
  }, []);

  const unlockWallet = async () => {
    dispatch(unlockWalletWithPin(pin));
    dispatch(clearValues());
  };

  return (
    <>
      <Auth
        handleValidationSuccess={() => unlockWallet()}
        handleValidationFailure={() => unlockWallet()}
      />
    </>
  );
};

export default AuthScreen;
