import React from 'react';
import {ScrollView, StyleSheet, Image} from 'react-native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import SettingCell from '../../components/Cells/SettingCell';

const General = props => {
  const biometricsAvailable = useSelector(
    state => state.authentication.biometricsAvailable,
  );
  const faceIDSupported = useSelector(
    state => state.authentication.faceIDSupported,
  );

  return (
    <LinearGradient style={styles.container} colors={['#F2F8FD', '#d2e1ef00']}>
      <Header />
      <ScrollView>
        <SettingCell title="About" value="meow" />
        <SettingCell
          title="Change Wallet Pin"
          onPress={() => props.navigation.navigate('ChangePincode')}>
          <Image source={require('../../assets/images/forward.png')} />
        </SettingCell>
        {biometricsAvailable ? (
          <SettingCell
            title={`Enable ${faceIDSupported ? 'Face ID' : 'Touch ID'}`}
            value="meow"
          />
        ) : null}
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
