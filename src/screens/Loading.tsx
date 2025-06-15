import React, {useEffect} from 'react';
import {StyleSheet, Linking, View} from 'react-native';
import type {StackNavigationProp} from '@react-navigation/stack';

import {startOnboarding} from '../reducers/onboarding';
import {resetLndState, startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';
import {checkInternetReachable} from '../reducers/info';
import {subscribeAppState} from '../reducers/authentication';
import {setDeeplink} from '../reducers/deeplinks';
import {updateFiredAlertsFromApiServer} from '../reducers/alerts';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {checkBuySellProviderCountry} from '../reducers/buy';
import {getItem, resetItem} from '../lib/utils/keychain';

type RootStackParamList = {
  Loading: undefined;
  AuthStack: undefined;
  Onboarding:
    | {
        screen?: 'Welcome' | 'InitialWithSeed';
        params?: {
          existingSeed: string;
        };
      }
    | undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Loading'>;
}

const Loading: React.FC<Props> = props => {
  const {navigation} = props;

  const dispatch = useAppDispatch();
  const passcodeSet = useAppSelector(state => state.authentication.passcodeSet);
  const {onboarding, seedVerified} = useAppSelector(state => state.onboarding);
  const isOnboarded = useAppSelector(state => state.onboarding.isOnboarded);

  // only start LND if wallet isOnboarded
  useEffect(() => {
    dispatch(resetLndState());
    if (isOnboarded) {
      dispatch(startLnd());
      // sync alerts
      dispatch(updateFiredAlertsFromApiServer());
    }
  }, [dispatch, isOnboarded]);

  useEffect(() => {
    dispatch(checkBiometricSupport());
    dispatch(checkInternetReachable());
    dispatch(subscribeAppState());
    dispatch(checkBuySellProviderCountry());
  }, [dispatch, isOnboarded]);

  useEffect(() => {
    const getURI = async () => {
      const data = await Linking.getInitialURL();
      if (data === null) {
        return false;
      } else {
        return data;
      }
    };

    const handleNavigation = async () => {
      const uri = await getURI();

      if (uri) {
        dispatch(setDeeplink(uri));
      }

      const seed = await getItem('SEEDPHRASE');
      // uncomment for dev purposes
      // if (__DEV__) {
      //   await resetItem('SEEDPHRASE');
      // }

      if (onboarding === false && isOnboarded === true) {
        navigation.replace('AuthStack');
      } else if (isOnboarded === false) {
        if (onboarding === true && passcodeSet === true && seedVerified) {
          navigation.navigate('Onboarding', {screen: 'Welcome'});
        } else {
          dispatch(startOnboarding());
          if (seed) {
            navigation.navigate('Onboarding', {
              screen: 'InitialWithSeed',
              params: {existingSeed: seed},
            });
          } else {
            navigation.navigate('Onboarding');
          }
        }
      } else {
        console.log('SOMETHING WENT WRONG!');
        // TODO (LOSHY!)
      }
    };

    handleNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <View style={styles.containter} />;
};

const styles = StyleSheet.create({
  containter: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default Loading;
