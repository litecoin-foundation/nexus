import React from 'react';
import {StyleSheet, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import RecoveryField from '../../components/RecoveryField';

const Forgot = ({navigation}) => {
  const {seed} = useSelector((state) => state.onboarding);

  const attemptLogin = async (seedAttempt) => {
    // validate user seed
    if (seedAttempt.toString() !== seed.toString()) {
      await Alert.alert(
        'Incorrect Paper-Key',
        null,
        [
          {
            text: 'Retry',
            onPress: null,
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
      return;
    }

    // if valid navigate to ChangePincode
    // route param 'type' will disable check for old pincode
    // and pop navigation to AuthScreen on success
    navigation.navigate('ChangePincode', {type: 'RESET'});
  };

  return (
    <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.gradient}>
      <Header />
      <RecoveryField
        handleLogin={(seedAttempt) => attemptLogin(seedAttempt)}
        headerText={
          'Forgot your pincode?\nEnter your paper-key to reset your pincode.'
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
});

Forgot.navigationOptions = () => {
  return {
    headerTitle: 'Reset Pincode',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default Forgot;
