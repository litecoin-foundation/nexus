import React, {useState} from 'react';
import {ScrollView, StyleSheet, DeviceEventEmitter, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {setBiometricEnabled} from '../../reducers/authentication';
import PinModal from '../../components/Modals/PinModal';

const General = (props) => {
  const dispatch = useDispatch();
  const [isPinModalTriggered, triggerPinModal] = useState(false);

  const biometricsAvailable = useSelector(
    (state) => state.authentication.biometricsAvailable,
  );
  const biometricsEnabled = useSelector(
    (state) => state.authentication.biometricsEnabled,
  );
  const faceIDSupported = useSelector(
    (state) => state.authentication.faceIDSupported,
  );

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
  };

  // TODO: okay I realise I shouldn't be using DeviceEventEmitter
  // need to figure out a better way in the future
  const handleAuthenticationRequired = () => {
    return new Promise((resolve, reject) => {
      triggerPinModal(true);
      const subscription = DeviceEventEmitter.addListener('auth', (bool) => {
        if (bool === true) {
          triggerPinModal(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SettingCell title="About" />
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
          <SettingCell
            title="View Paper Key"
            onPress={() => {
              handleAuthenticationRequired()
                .then(() => props.navigation.navigate('Seed'))
                .catch(() =>
                  Alert.alert('Incorrect Pincode', null, [
                    {
                      text: 'Dismiss',
                      onPress: () => triggerPinModal(false),
                      style: 'cancel',
                    },
                  ]),
                );
            }}
            forward
          />
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

General.navigationOptions = () => {
  return {
    headerTitle: 'General',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default General;
