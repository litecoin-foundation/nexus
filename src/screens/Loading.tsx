import React, {useEffect} from 'react';
import {StyleSheet, Linking, View} from 'react-native';
import type {StackNavigationProp} from '@react-navigation/stack';

import {startOnboarding} from '../reducers/onboarding';
import {startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';
import {checkInternetReachable} from '../reducers/info';
import {subscribeAppState} from '../reducers/authentication';
import {setDeeplink} from '../reducers/deeplinks';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {sleep} from '../lib/utils/poll';

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

  useEffect(() => {
    sleep(5000).then(() => dispatch(startLnd()));
    dispatch(checkBiometricSupport());
    dispatch(checkInternetReachable());
    // dispatch(startLnd());
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
      } else {
        dispatch(startOnboarding());
        navigation.navigate('Onboarding');
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
