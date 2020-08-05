import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import {useDispatch} from 'react-redux';

import Header from '../../components/Header';
import BlueButton from '../../components/Buttons/BlueButton';
import {connectToPeer} from '../../reducers/channels';

const OpenChannel = () => {
  const dispatch = useDispatch();
  const [pubkey, setPubkey] = useState(null);

  const handlePress = async () => {
    await dispatch(connectToPeer(pubkey));
  };

  return (
    <View style={styles.container}>
      <Header />
      <Text>ENTER PUBKEY</Text>
      <TextInput
        placeholder="host"
        onChangeText={(input) => setPubkey(input)}
      />
      <Text>OR</Text>
      <TouchableOpacity>
        <Text>Paste</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text>Scan</Text>
      </TouchableOpacity>
      <BlueButton value="Open Channel" onPress={() => handlePress()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
});

OpenChannel.navigationOptions = () => {
  return {
    headerTitle: 'Open Channel',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default OpenChannel;
