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
  onPressClose: () => void;
  onScanPress: () => void;
}

const AddressField: React.FC<Props> = props => {
  const {address, onPressClose, onScanPress} = props;

  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor="#dbdbdb"
        style={styles.text}
        value={address}
        autoCorrect={false}
        autoComplete="off"
      />

      <TouchableHighlight onPress={onScanPress}>
        <Image source={require('../assets/images/qrcode-btn.png')} />
      </TouchableHighlight>

      {/* <TouchableOpacity style={styles.closeContainer} onPress={onPressClose}>
        <Image
          style={styles.circle}
          source={require('../assets/images/check-off.png')}
        />
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: '#DEDEDE',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  text: {
    paddingLeft: 11.5,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
  },
  closeContainer: {
    right: 0,
    position: 'absolute',
    paddingRight: 25,
  },
  circle: {
    height: 18,
    width: 18,
  },
});

export default AddressField;
