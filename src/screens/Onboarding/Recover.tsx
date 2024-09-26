import React from 'react';
import {Platform, SafeAreaView, StyleSheet, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {setSeedRecovery} from '../../reducers/onboarding';
import RecoveryField from '../../components/RecoveryField';
import {RouteProp} from '@react-navigation/native';
import {useAppDispatch} from '../../store/hooks';
import HeaderButton from '../../components/Buttons/HeaderButton';

interface Props {
  navigation: RouteProp<RootStackParamList, 'Recover'>;
}

type RootStackParamList = {
  Recover: undefined;
  Pin: undefined;
};

const Recover: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const attemptLogin = async (seed: string[]) => {
    await dispatch(setSeedRecovery(seed));
    navigation.navigate('Pin');
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']}>
      <SafeAreaView>
        <RecoveryField
          handleLogin={seed => attemptLogin(seed)}
          headerText="Enter your paper-key words below."
          isLitewalletRecovery={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const RecoverNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Recover Wallet</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        title="Back"
      />
    ),
  };
};

export default Recover;
