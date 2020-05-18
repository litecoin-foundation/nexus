import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';
import {setBiometricEnabled} from '../../reducers/authentication';

const General = (props) => {
  const dispatch = useDispatch();
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

  return (
    <LinearGradient style={styles.container} colors={['#F2F8FD', '#d2e1ef00']}>
      <Header />
      <ScrollView>
        <SettingCell title="About" />
        <SettingCell
          title="Change Wallet Pin"
          onPress={() => props.navigation.navigate('ChangePincode')}
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
          onPress={() => props.navigation.navigate('ChangePincode')}
          forward
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
