import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableHighlight,
  Platform,
  Text,
} from 'react-native';

interface Props {
  address: string;
  onScanPress: () => void;
  onChangeText: (text: string) => void;
}

const AddressField: React.FC<Props> = props => {
  const {address, onScanPress, onChangeText} = props;

  useEffect(() => {
    hiddenTextRef.current = address;
  }, [address]);

  // logic below to calculate and resize height of container
  const [height, setHeight] = useState(53);
  const textInputWidth = useRef(310);
  const hiddenTextRef = useRef<string>('');
  const textLayoutRef = useRef<any>(null);

  const handleTextChange = (text: string) => {
    hiddenTextRef.current = text;
    onChangeText(text);
  };

  const onMeasuredTextLayout = (event: any) => {
    const {height: measuredHeight} = event.nativeEvent.layout;
    const lines = measuredHeight / 22;
    const newHeight = lines * 37;
    if (newHeight !== height) {
      setHeight(newHeight);
    }
  };

  const onLayout = (event: any) => {
    textInputWidth.current = event.nativeEvent.layout.width;
  };

  useEffect(() => {
    // updates height based on address prop
    if (textLayoutRef.current) {
      textLayoutRef.current.measure(
        (_: number, __: number, ___: number, textHeight: number) => {
          const lines = textHeight / 22;
          const newHeight = lines * 32;
          setHeight(newHeight);
        },
      );
    }
  }, [address]);

  return (
    <View style={[styles.container, {height}]} onLayout={onLayout}>
      <View style={styles.hiddenContainer}>
        <Text
          ref={textLayoutRef}
          style={[styles.hiddenText, {width: textInputWidth.current}]}
          onLayout={onMeasuredTextLayout}>
          {hiddenTextRef.current}
        </Text>
      </View>

      <TextInput
        placeholderTextColor="#dbdbdb"
        placeholder="Enter a Litecoin Address"
        style={styles.text}
        value={address}
        autoCorrect={false}
        autoComplete="off"
        onChangeText={handleTextChange}
        blurOnSubmit={true}
        enterKeyHint={'done'}
        multiline={true}
        scrollEnabled={false}
        maxLength={121}
      />

      <TouchableHighlight style={styles.closeContainer} onPress={onScanPress}>
        <Image source={require('../assets/images/qrcode-btn.png')} />
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 49,
    borderRadius: 8,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 11.5,
    paddingTop: 7,
  },
  text: {
    flex: 1,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
    maxWidth: 310,
    textAlignVertical: 'top',
  },
  closeContainer: {
    right: 0,
    position: 'absolute',
    marginRight: 25,
  },
  hiddenContainer: {
    position: 'absolute',
    opacity: 0,
  },
  hiddenText: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    maxWidth: 310,
  },
});

export default AddressField;
