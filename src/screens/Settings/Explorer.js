import React, {useState} from 'react';
import {ScrollView, StyleSheet, DeviceEventEmitter, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {setBiometricEnabled} from '../../reducers/authentication';

const Explorer = props => {
  const dispatch = useDispatch();

  const biometricsAvailable = useSelector(
    state => state.authentication.biometricsAvailable,
  );
  const biometricsEnabled = useSelector(
    state => state.authentication.biometricsEnabled,
  );
  const faceIDSupported = useSelector(
    state => state.authentication.faceIDSupported,
  );

  const handleBiometricSwitch = () => {
    dispatch(setBiometricEnabled(!biometricsEnabled));
  };

  const handleAuthenticationRequired = () => {
    return new Promise((resolve, reject) => {
      triggerPinModal(true);
      const subscription = DeviceEventEmitter.addListener('auth', bool => {
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
    <React.Fragment>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <ScrollView>
          <SettingCell
            title="Default explorer"
            onPress={() => props.navigation.navigate('DefaultExplorer')}
            forward
          />
        </ScrollView>
      </LinearGradient>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
});

Explorer.navigationOptions = () => {
  return {
    headerTitle: 'Explorer',
  };
};

export default Explorer;
