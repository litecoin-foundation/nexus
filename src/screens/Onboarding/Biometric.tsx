import React from 'react';
import {View, StyleSheet, SafeAreaView, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {authenticate} from '../../lib/utils/biometric';
import {setBiometricEnabled} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StackNavigationProp} from '@react-navigation/stack';
import HeaderButton from '../../components/Buttons/HeaderButton';

type RootStackParamList = {
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Biometric'>;
}

const Biometric: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <SafeAreaView />

      <Card
        titleText={biometryType}
        descriptionText={`Would you like to use ${biometryType} to unlock your wallet?`}
        imageSource={
          faceIDSupported
            ? require('../../assets/images/face-id-blue.png')
            : require('../../assets/images/touch-id-blue.png')
        }
      />

      <View style={styles.subContainer}>
        <WhiteButton
          value={`Enable ${biometryType}`}
          small={false}
          active={true}
          onPress={async () => {
            try {
              await authenticate(`Enable ${biometryType}`);
              dispatch(setBiometricEnabled(true));
              navigation.navigate('Welcome');
            } catch (error) {
              console.log(error);
              return;
            }
          }}
        />
        <WhiteClearButton
          textKey="maybe"
          textDomain="onboarding"
          small={false}
          onPress={() => {
            dispatch(setBiometricEnabled(false));
            navigation.navigate('Welcome');
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const BiometricNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Enable Biometric Login?</Text>
    ),
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

export default Biometric;
