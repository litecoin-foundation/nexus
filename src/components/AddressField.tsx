import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableHighlight,
  Platform,
} from 'react-native';

interface Props {
  address: string;
  onScanPress: () => void;
  onChangeText: (text: string) => void;
}

const AddressField: React.FC<Props> = props => {
  const {address, onScanPress, onChangeText} = props;

  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor="#dbdbdb"
        placeholder="Address to send Litecoin"
        style={styles.text}
        value={address}
        autoCorrect={false}
        autoComplete="off"
        onChangeText={onChangeText}
        blurOnSubmit={false}
      />

      <TouchableHighlight style={styles.closeContainer} onPress={onScanPress}>
        <Image source={require('../assets/images/qrcode-btn.png')} />
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 63,
    borderRadius: 8,
    borderColor: '#DEDEDE',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingLeft: 11.5,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
    maxWidth: 310,
  },
  closeContainer: {
    right: 0,
    position: 'absolute',
    paddingRight: 25,
  },
});

export default AddressField;
