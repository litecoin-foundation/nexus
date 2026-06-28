import React, {useEffect, useLayoutEffect, useState} from 'react';
import {StackNavigationProp} from '@react-navigation/stack';
import {WalletState} from 'react-native-nitro-lndltc';

import Auth from '../../components/Auth';
import {
  unlockWalletWithPin,
  unlockWalletWithBiometric,
} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Auth: undefined;
  Unlocking: undefined;
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
  const walletState = useAppSelector(state => state.lightning.walletState);
  const [unlockInitiated, setUnlockInitiated] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
    });
  });

  // Presents Biometric authentication on launch
  // If biometricEnabled & wallet is locked, present Biometric auth request
  useEffect(() => {
    if (biometricsEnabled && walletState === WalletState.LOCKED) {
      setUnlockInitiated(true);
      dispatch(unlockWalletWithBiometric());
    }
  }, [biometricsEnabled, walletState, dispatch]);

  // Once authentication succeeds and the wallet actually starts unlocking
  // (LND leaves the LOCKED state), hand off to the Unlocking transition
  // screen so the remaining RPC startup wait is covered by an animation
  // rather than a frozen pad. A wrong PIN keeps the wallet LOCKED, so we
  // stay on this screen for the retry.
  useEffect(() => {
    const unlockStarted =
      walletState === WalletState.UNLOCKED ||
      walletState === WalletState.RPC_ACTIVE ||
      walletState === WalletState.SERVER_ACTIVE;

    if (unlockInitiated && unlockStarted) {
      navigation.replace('Unlocking');
    }
  }, [walletState, navigation, unlockInitiated]);

  const unlockWallet = async () => {
    setUnlockInitiated(true);
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
