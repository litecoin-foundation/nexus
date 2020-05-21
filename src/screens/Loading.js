import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import {startOnboarding} from '../reducers/onboarding';
import {startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';

const Loading = (props) => {
  const dispatch = useDispatch();
  const onboarding = useSelector((state) => state.onboarding.onboarding);
  const isOnboarded = useSelector((state) => state.onboarding.isOnboarded);

  useEffect(() => {
    dispatch(checkBiometricSupport());
    dispatch(startLnd());
  }, [dispatch]);

  if (onboarding === false && isOnboarded === true) {
    props.navigation.replace('Auth');
  } else {
    dispatch(startOnboarding());
    props.navigation.navigate('Onboarding');
  }

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
