import React from 'react';
import {StyleSheet, Alert, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import RecoveryField from '../../components/RecoveryField';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';

import {useAppSelector} from '../../store/hooks';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';

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
  const {t} = useTranslation('onboarding');

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
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
        <View style={styles.header} />
        <RecoveryField
          handleLogin={seedAttempt => attemptLogin(seedAttempt)}
          headerText={t('forgot_pin_description')}
          isLitewalletRecovery={false}
        />
      </CustomSafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    height: '100%',
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

export const ForgotNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey="forgot_pin"
        domain="onboarding"
        textStyle={styles.headerTitle}
      />
    ),
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
