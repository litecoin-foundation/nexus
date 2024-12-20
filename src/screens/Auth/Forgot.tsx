import React from 'react';
import {StyleSheet, Alert, Text, Platform, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import RecoveryField from '../../components/RecoveryField';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppSelector} from '../../store/hooks';

type RootStackParamList = {
  Forgot: undefined;
  ChangePincode: {
    type: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Forgot'>;
}

const Forgot: React.FC<Props> = ({navigation}) => {
  const {seed} = useAppSelector(state => state.onboarding);

  const attemptLogin = async (seedAttempt: string[]) => {
    // validate user seed
    if (seedAttempt.toString() !== seed.toString()) {
      await Alert.alert(
        'Incorrect Paper-Key',
        undefined,
        [
          {
            text: 'Retry',
            onPress: undefined,
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
    <LinearGradient colors={['#1162E6', '#0F55C7']}>
      <View style={styles.header} />
      <RecoveryField
        handleLogin={seedAttempt => attemptLogin(seedAttempt)}
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
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  header: {
    height: 70,
  },
});

export const ForgotNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Forgot Pincode?</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Forgot;
