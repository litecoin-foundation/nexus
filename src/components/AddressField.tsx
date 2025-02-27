import React, {useEffect, useRef, useState, useContext} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  address: string;
  onScanPress: () => void;
  onPastePress: () => void;
  onChangeText: (text: string) => void;
  validateAddress: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  clearInput: () => void;
}

const AddressField: React.FC<Props> = props => {
  const {
    address,
    onScanPress,
    onPastePress,
    onChangeText,
    validateAddress,
    onFocus,
    onBlur,
    clearInput,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {t} = useTranslation('sendTab');

  const lineHeight = SCREEN_HEIGHT * 0.033;
  const fontLineHeight = SCREEN_HEIGHT * 0.026;

  const [isActive, setActive] = useState(false);

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

  const pasteScaler = useSharedValue(1);
  const scanScaler = useSharedValue(1);
  const pasteBg = useSharedValue(1);
  const scanBg = useSharedValue(1);
  const pasteX = useSharedValue(0);
  const scanX = useSharedValue(0);
  const closeX = useSharedValue(70);
  const activeOpacity = useSharedValue(1);

  const pasteContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {scale: pasteScaler.value},
        {translateX: withSpring(pasteX.value, {stiffness: 50})},
      ],
      backgroundColor: interpolateColor(
        pasteBg.value,
        [0, 1],
        ['#C5C5C5', '#f7f7f7'],
      ),
      opacity: activeOpacity.value,
    };
  });

  const scanContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {scale: scanScaler.value},
        {translateX: withSpring(scanX.value, {stiffness: 50})},
      ],
      backgroundColor: interpolateColor(
        scanBg.value,
        [0, 1],
        ['#C5C5C5', '#f7f7f7'],
      ),
      opacity: activeOpacity.value,
    };
  });

  const closeContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: withSpring(closeX.value, {stiffness: 50})}],
    };
  });

  const onPressIn = (button: string) => {
    switch (button) {
      case 'paste':
        pasteScaler.value = withSpring(0.9, {mass: 1});
        pasteBg.value = withTiming(0);
        break;
      case 'scan':
        scanScaler.value = withSpring(0.9, {mass: 1});
        scanBg.value = withTiming(0);
        break;
    }
  };

  const onPressOut = (button: string) => {
    switch (button) {
      case 'paste':
        pasteScaler.value = withSpring(1, {mass: 0.7});
        pasteBg.value = withTiming(1);
        break;
      case 'scan':
        scanScaler.value = withSpring(1, {mass: 0.7});
        scanBg.value = withTiming(1);
        break;
    }
  };

  useEffect(() => {
    if (address !== '') {
      // AddressField is active
      pasteX.value = 92;
      scanX.value = 50;
      closeX.value = 0;
      activeOpacity.value = withTiming(0, {duration: 230}, () => {
        runOnJS(setActive)(true);
      });
    } else {
      // AddressField is inactive (empty)
      pasteX.value = 0;
      scanX.value = 0;
      closeX.value = 80;
      activeOpacity.value = withTiming(1, {duration: 500});
      runOnJS(setActive)(false);
    }
  }, [address]);

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
        placeholder={t('enter_address')}
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
        allowFontScaling={false}
      />

      {isActive ? null : (
        <>
          <Pressable
            style={[styles.pasteContainer]}
            onPressIn={() => onPressIn('paste')}
            onPressOut={() => onPressOut('paste')}
            onPress={onPastePress}
            disabled={isActive}>
            <Animated.View
              style={[styles.pasteSubContainer, pasteContainerMotionStyle]}>
              <Animated.Image
                style={styles.icon}
                source={require('../assets/images/paste.png')}
              />
            </Animated.View>
          </Pressable>

          <Pressable
            style={[styles.closeContainer]}
            onPressIn={() => onPressIn('scan')}
            onPressOut={() => onPressOut('scan')}
            onPress={onScanPress}
            disabled={isActive}>
            <Animated.View
              style={[styles.scanSubContainer, scanContainerMotionStyle]}>
              <Animated.Image
                source={require('../assets/images/qrcode-btn.png')}
              />
            </Animated.View>
          </Pressable>
        </>
      )}

      {!isActive ? null : (
        <Pressable
          style={styles.closeContainer}
          disabled={!isActive}
          onPress={() => {
            clearInput();
            validateAddress('');
          }}>
          <Animated.View
            style={[styles.closeSubContainer, closeContainerMotionStyle]}>
            <Image
              style={styles.closeIcon}
              source={require('../assets/images/close.png')}
            />
          </Animated.View>
        </Pressable>
      )}
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
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      textAlignVertical: 'top',
      paddingTop: Platform.OS === 'android' ? 0 : 3,
    },
    pasteContainer: {
      right: 54,
      position: 'absolute',
      height: 36,
      width: 36,
    },
    pasteSubContainer: {
      borderRadius: screenHeight * 0.007,
      height: '100%',
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeContainer: {
      right: 0,
      position: 'absolute',
      marginRight: 12,
      height: 36,
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeSubContainer: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      width: 8,
      height: 8,
    },
    scanSubContainer: {
      height: '100%',
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: screenHeight * 0.007,
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
      opacity: 0,
    },
    icon: {
      width: 20,
      height: 18,
    },
  });

export default AddressField;
