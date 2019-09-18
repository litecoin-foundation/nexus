import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch, useSelector} from 'react-redux';

import {enableChannelBackup} from '../../reducers/channels';

const ChannelBackup = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();
  const biometricsAvailable = useSelector(
    state => state.authentication.biometricsAvailable,
  );

  return (
    <View>
      <Text>iCloud Backup</Text>
      <Text>
        Your lightning balances will be backed up to the Cloud securely
        (encrypted so only your device can decrypt it). It is very strongly
        recommended that you enable this.
      </Text>
      <TouchableOpacity
        onPress={() => {
          dispatch(enableChannelBackup());

          if (!biometricsAvailable) {
            navigate('Welcome');
          } else {
            navigate('Biometric');
          }
        }}>
        <Text>Enable Cloud Backup</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          if (!biometricsAvailable) {
            navigate('Welcome');
          } else {
            navigate('Biometric');
          }
        }}>
        <Text>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChannelBackup;
