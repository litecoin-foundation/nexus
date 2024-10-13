import React, {useState} from 'react';
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

  const [height, setHeight] = useState(53);

  return (
    <View style={[styles.container, {height: Math.max(53, height)}]}>
      <TextInput
        placeholderTextColor="#dbdbdb"
        placeholder="Enter a Litecoin Address"
        style={styles.text}
        value={address}
        autoCorrect={false}
        autoComplete="off"
        onChangeText={onChangeText}
        blurOnSubmit={true}
        enterKeyHint={'done'}
        multiline={true}
        onContentSizeChange={event => {
          setHeight(event.nativeEvent.contentSize.height + 20);
        }}
      />

      <TouchableHighlight style={styles.closeContainer} onPress={onScanPress}>
        <Image source={require('../assets/images/qrcode-btn.png')} />
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 53,
    borderRadius: 8,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingLeft: 11.5,
    paddingRight: 11.5,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
    maxWidth: 310,

    paddingVertical: 13,
  },
  closeContainer: {
    right: 0,
    position: 'absolute',
    marginRight: 25,
  },
});

export default AddressField;
