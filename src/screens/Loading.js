import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import {startOnboarding} from '../reducers/onboarding';
import {startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';
import {checkInternetReachable} from '../reducers/info';
import {subscribeAppState} from '../reducers/authentication';

const Loading = props => {
  const dispatch = useDispatch();
  const onboarding = useSelector(state => state.onboarding.onboarding);
  const isOnboarded = useSelector(state => state.onboarding.isOnboarded);

  useEffect(() => {
    dispatch(checkBiometricSupport());
    dispatch(checkInternetReachable());
    dispatch(startLnd());
    dispatch(subscribeAppState());
  }, [dispatch]);

  useEffect(() => {
    if (onboarding === false && isOnboarded === true) {
      props.navigation.replace('AuthStack');
    } else {
      dispatch(startOnboarding());
      props.navigation.navigate('Onboarding');
    }
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

Loading.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerTintColor: 'white',
  headerShown: false,
};

export default Loading;
