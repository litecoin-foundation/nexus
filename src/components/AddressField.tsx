import React, {useEffect, useRef, useState, useContext} from 'react';
import {View, TextInput, StyleSheet, Text, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  address: string;
  onScanPress: () => void;
  onChangeText: (text: string) => void;
  validateAddress: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const AddressField: React.FC<Props> = props => {
  const {address, onScanPress, onChangeText, validateAddress, onFocus, onBlur} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const lineHeight = SCREEN_HEIGHT * 0.033;
  const fontLineHeight = SCREEN_HEIGHT * 0.026;

  useEffect(() => {
    hiddenTextRef.current = address;
  }, [address]);

  // logic below to calculate and resize height of container
  const [height, setHeight] = useState(SCREEN_HEIGHT * 0.06);
  const hiddenTextRef = useRef<string>('');
  const textLayoutRef = useRef<any>(null);

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const onMeasuredTextLayout = (event: any) => {
    const {height: measuredHeight} = event.nativeEvent.layout;
    const lines = measuredHeight / fontLineHeight;
    // Plus padding
    const newHeight = lines * lineHeight + SCREEN_HEIGHT * 0.02;
    if (newHeight !== height) {
      setHeight(newHeight);
    }
  };

  useEffect(() => {
    // updates height based on address prop
    if (textLayoutRef.current) {
      textLayoutRef.current.measure(
        (_: number, __: number, ___: number, textHeight: number) => {
          const lines = textHeight / fontLineHeight;
          // Plus padding
          const newHeight = lines * lineHeight + SCREEN_HEIGHT * 0.02;
          setHeight(newHeight);
        },
      );
    }
  }, [address]);

  // animation

  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <View style={[styles.container, {height}]}>
      <View style={styles.hiddenContainer}>
        <Text
          ref={textLayoutRef}
          style={styles.hiddenText}
          onLayout={onMeasuredTextLayout}>
          {address}
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
        onEndEditing={e => validateAddress(e.nativeEvent.text)}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <Pressable
        style={styles.closeContainer}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onScanPress}>
        <Animated.Image
          style={motionStyle}
          source={require('../assets/images/qrcode-btn.png')}
        />
      </Pressable>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      minHeight: screenHeight * 0.06,
      borderRadius: screenHeight * 0.01,
      borderColor: '#E8E8E8',
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      paddingHorizontal: screenHeight * 0.02,
      paddingVertical: screenHeight * 0.01,
    },
    text: {
      flex: 1,
      width: screenWidth * 0.7,
      maxWidth: screenWidth * 0.7,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      fontSize: screenHeight * 0.022,
      textAlignVertical: 'top',
    },
    closeContainer: {
      right: 0,
      position: 'absolute',
      marginRight: 12,
      height: '100%',
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hiddenContainer: {
      position: 'absolute',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingHorizontal: screenHeight * 0.02,
      paddingVertical: screenHeight * 0.01,
      opacity: 0,
    },
    hiddenText: {
      width: screenWidth * 0.7,
      maxWidth: screenWidth * 0.7,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.022,
      textAlignVertical: 'top',
    },
  });

export default AddressField;
