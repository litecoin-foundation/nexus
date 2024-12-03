import React, {useEffect} from 'react';
import {StyleSheet, Linking, View} from 'react-native';
import type {StackNavigationProp} from '@react-navigation/stack';

import {startOnboarding} from '../reducers/onboarding';
import {resetLndState, startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';
import {checkInternetReachable} from '../reducers/info';
import {subscribeAppState} from '../reducers/authentication';
import {setDeeplink} from '../reducers/deeplinks';
import {useAppDispatch, useAppSelector} from '../store/hooks';

type RootStackParamList = {
  Loading: undefined;
  AuthStack: undefined;
  Onboarding: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Loading'>;
}

const Loading: React.FC<Props> = props => {
  const {navigation} = props;

  const dispatch = useAppDispatch();
  const onboarding = useAppSelector(state => state.onboarding.onboarding);
  const isOnboarded = useAppSelector(state => state.onboarding.isOnboarded);

  // only start LND if wallet isOnboarded
  useEffect(() => {
    dispatch(resetLndState());
    if (isOnboarded) {
      dispatch(startLnd());
    }
  }, [dispatch, isOnboarded]);

  useEffect(() => {
    dispatch(checkBiometricSupport());
    dispatch(checkInternetReachable());
    dispatch(subscribeAppState());
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

      if (onboarding === false && isOnboarded === true) {
        navigation.replace('AuthStack');
      } else if (isOnboarded === false) {
        dispatch(startOnboarding());
        navigation.navigate('Onboarding');
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
