import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {authenticate} from '../../lib/utils/biometric';
import {setBiometricEnabled} from '../../reducers/authentication';

const Biometric = (props) => {
  const dispatch = useDispatch();
  const faceIDSupported = useSelector(
    (state) => state.authentication.faceIDSupported,
  );
  const biometryType = faceIDSupported ? 'Face ID' : 'Touch ID';

  return (
    <LinearGradient colors={['#544FE6', '#1c44b4']} style={styles.container}>
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

      <View>
        <WhiteButton
          value={`Enable ${biometryType}`}
          small={false}
          active={true}
          onPress={async () => {
            try {
              await authenticate(`Enable ${biometryType}`);
              dispatch(setBiometricEnabled(true));
              props.navigation.navigate('Welcome');
            } catch (error) {
              console.log(error);
              return;
            }
          }}
        />
        <WhiteClearButton
          value="Maybe later"
          small={true}
          onPress={() => {
            dispatch(setBiometricEnabled(false));
            props.navigation.navigate('Welcome');
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
    justifyContent: 'space-around',
  },
});

Biometric.navigationOptions = {
  headerTitle: 'Enable Biometrics',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
};

export default Biometric;
