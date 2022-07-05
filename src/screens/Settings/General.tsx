import React, {useState} from 'react';
import {StyleSheet, ScrollView, DeviceEventEmitter} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {setBiometricEnabled} from '../../reducers/authentication';
import PinModal from '../../components/Modals/PinModal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StackNavigationProp} from '@react-navigation/stack';

type RootStackParamList = {
  General: undefined;
  About: undefined;
  ChangePincode: {
    type: null;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'General'>;
}

const General: React.FC<Props> = props => {
  const dispatch = useAppDispatch();
  const [isPinModalTriggered, triggerPinModal] = useState(false);

  const biometricsAvailable = useAppSelector(
    state => state.authentication.biometricsAvailable,
  );
  const biometricsEnabled = useAppSelector(
    state => state.authentication.biometricsEnabled,
  );
  const faceIDSupported = useAppSelector(
    state => state.authentication.faceIDSupported,
  );

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
  };

  // const handleAuthenticationRequired = () => {
  //   return new Promise((resolve, reject) => {
  //     triggerPinModal(true);
  //     const subscription = DeviceEventEmitter.addListener('auth', bool => {
  //       if (bool === true) {
  //         triggerPinModal(false);
  //         subscription.remove();
  //         resolve();
  //       } else if (bool === false) {
  //         subscription.remove();
  //         reject();
  //       }
  //     });
  //   });
  // };

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SettingCell
            title="About"
            onPress={() => props.navigation.navigate('About')}
            forward
          />
          <SettingCell
            title="Change Wallet Pin"
            onPress={() =>
              props.navigation.navigate('ChangePincode', {type: null})
            }
            forward
          />
          {biometricsAvailable ? (
            <SettingCell
              title={`Enable ${faceIDSupported ? 'Face ID' : 'Touch ID'}`}
              switchEnabled
              switchValue={biometricsEnabled}
              handleSwitch={handleBiometricSwitch}
            />
          ) : null}
        </ScrollView>
      </LinearGradient>

      <PinModal
        isVisible={isPinModalTriggered}
        close={() => triggerPinModal(false)}
        handleValidationFailure={() => DeviceEventEmitter.emit('auth', false)}
        handleValidationSuccess={() => DeviceEventEmitter.emit('auth', true)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
});

export default General;
