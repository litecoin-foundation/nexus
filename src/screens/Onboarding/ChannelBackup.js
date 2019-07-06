import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';

import { enableChannelBackup } from '../../reducers/channels';
import { initWallet } from '../../reducers/lightning';

const ChannelBackup = () => {
  const { navigate } = useNavigation();
  const dispatch = useDispatch();

  const handlePress = () => {
    dispatch(enableChannelBackup());
    dispatch(initWallet());
    navigate('App');
  };
  return (
    <View>
      <Text>iCloud Backup</Text>
      <Text>
        Your lightning balances will be backed up to the Cloud securely (encrypted so only your
        device can decrypt it). It is very strongly recommended that you enable this.
      </Text>
      <TouchableOpacity onPress={() => handlePress()}>
        <Text>Enable Cloud Backup</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigate('App')}>
        <Text>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChannelBackup;
