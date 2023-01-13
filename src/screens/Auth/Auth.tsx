import React, {useEffect, useState} from 'react';
import {Alert, ActivityIndicator, StyleSheet, View} from 'react-native';
import lnd, {ss_lnrpc} from '@litecoinfoundation/react-native-lndltc';
import {StackNavigationProp} from '@react-navigation/stack';

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
  AppStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
}

const AuthScreen: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  // const unlockerLoopRef = useRef();
  const [loading, setLoading] = useState(false);

  const pin = useAppSelector(state => state.authpad.pin);
  const biometricsEnabled = useAppSelector(
    state => state.authentication.biometricsEnabled,
  );
  const walletUnlocked = useAppSelector(
    state => state.authentication.walletUnlocked,
  );

  // Presents Biometric authentication on launch
  // If biometricEnabled & lnd is ready, present Biometric auth request
  useEffect(() => {
    if (biometricsEnabled) {
      lnd.stateService.subscribeToStateChanges(
        res => {
          if (res.isOk()) {
            if (res.value === ss_lnrpc.WalletState.WAITING_TO_START) {
              dispatch(unlockWalletWithBiometric());
            }
          }
        },
        () => {},
      );
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
        navigation.replace('AppStack');
        clear();
        break;
      default:
        return;
    }
  });

  useEffect(() => {
    return () => {
      setLoading(false);
      // clearInterval(unlockerLoopRef.current);
    };
  }, []);

  const unlockWallet = async () => {
    // setLoading(true);
    // unlockerLoopRef.current = setInterval(async () => {

    // }, 2500);
    await dispatch(unlockWalletWithPin(pin));
    await dispatch(clearValues());
  };

  const handleValidationFailure = () => {
    Alert.alert('Incorrect PIN', 'Try Again', [{text: 'OK'}], {
      cancelable: false,
    });
  };

  return (
    <>
      <Auth
        headerDescriptionText="Use your PIN to unlock your Wallet"
        handleValidationSuccess={() => unlockWallet()}
        handleValidationFailure={handleValidationFailure}
      />
      {loading ? (
        <View style={styles.activity}>
          <View style={styles.container}>
            <ActivityIndicator size="large" />
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  activity: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'rgba(10,10,10,0.8)',
    height: 100,
    width: 100,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuthScreen;
