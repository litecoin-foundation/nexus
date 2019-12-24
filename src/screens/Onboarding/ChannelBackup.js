import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import Card from '../../components/Card';
import {enableChannelBackup} from '../../reducers/channels';

const ChannelBackup = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();
  const biometricsAvailable = useSelector(
    state => state.authentication.biometricsAvailable,
  );

  return (
    <LinearGradient colors={['#544FE6', '#003DB3']} style={styles.container}>
      <SafeAreaView />
      <Card
        titleText="iCloud Backup"
        descriptionText="Your lightning balances will be backed up to the Cloud securely
            (encrypted so only your device can decrypt it). It is very strongly
            recommended that you enable this."
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
              navigate('Welcome');
            } else {
              navigate('Biometric');
            }
          }}
        />

        <WhiteClearButton
          value="Maybe Later"
          small={true}
          onPress={() => {
            if (!biometricsAvailable) {
              navigate('Welcome');
            } else {
              navigate('Biometric');
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
  headerTitle: 'iCloud Backup',
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
  headerTransparent: true,
  headerBackTitle: null,
};

export default ChannelBackup;
