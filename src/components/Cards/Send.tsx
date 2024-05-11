import React, {useState} from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import InputField from '../InputField';
import AddressField from '../AddressField';
import {StackNavigationProp} from '@react-navigation/stack';

type RootStackParamList = {
  Send: undefined;
  Scan: {
    returnRoute: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Send'>;
}

const Send: React.FC<Props> = props => {
  const {navigation} = props;
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
        <Text style={styles.titleText}>Send LTC</Text>

        <Text style={styles.subtitleText}>Amount</Text>

        <Text style={styles.subtitleText}>To Address</Text>
        <AddressField
          address={address}
          onPressClose={() => setAddress('')}
          onScanPress={() => navigation.navigate('Scan', {returnRoute: 'Main'})}
        />

        <Text style={styles.subtitleText}>Add Description</Text>
        <InputField
          value={description}
          onChangeText={text => setDescription(text)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  subcontainer: {
    marginHorizontal: 24,
  },
  titleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 24,
  },
  subtitleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
  },
});

export default Send;
