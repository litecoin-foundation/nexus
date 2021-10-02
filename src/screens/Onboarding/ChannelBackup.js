import React from 'react';
import {View, StyleSheet, SafeAreaView, Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {enableChannelBackup} from '../../reducers/channels';

const ChannelBackup = (props) => {
  const dispatch = useDispatch();
  const biometricsAvailable = useSelector(
    (state) => state.authentication.biometricsAvailable,
  );

  const backupProvider = Platform.OS === 'android' ? 'Google Drive' : 'iCloud';

  return (
    <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.container}>
      <SafeAreaView />
      <Card
        titleText={`${backupProvider} Backup`}
        descriptionText={`Lightning balances are encrypted, so only your device can decrypt it). It is very strongly
            recommended that you enable this.`}
        imageSource={require('../../assets/images/cloud.png')}
      />

      <View>
        <WhiteButton
          value="Enable Cloud Backup"
          small={false}
          active={true}
          onPress={() => {
            dispatch(enableChannelBackup());

            if (!biometricsAvailable) {
              props.navigation.navigate('Welcome');
            } else {
              props.navigation.navigate('Biometric');
            }
          }}
        />

        <WhiteClearButton
          value="Maybe Later"
          small={true}
          onPress={() => {
            if (!biometricsAvailable) {
              props.navigation.navigate('Welcome');
            } else {
              props.navigation.navigate('Biometric');
            }
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

ChannelBackup.navigationOptions = {
  headerTitle:
    Platform.OS === 'android' ? 'Google Drive Backup' : 'iCloud Backup',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
};

export default ChannelBackup;
