import React, {useEffect, useRef, useState, useContext} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  Image,
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

  const MULTILINE_HEIGHT = SCREEN_HEIGHT * 0.04;
  const LINE_HEIGHT = SCREEN_HEIGHT * 0.025; // Line height for text
  const PADDING = SCREEN_HEIGHT * 0.01; // Padding for multiline content

  const [isActive, setActive] = useState(false);
  const hiddenTextRef = useRef<string>('');
  const textLayoutRef = useRef<any>(null);

  useEffect(() => {
    hiddenTextRef.current = address;
  }, [address]);

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const onMeasuredTextLayout = (event: any) => {
    const {height: measuredHeight} = event.nativeEvent.layout;

    const lines = Math.max(1, Math.ceil(measuredHeight / LINE_HEIGHT)) - 1;

    const newHeight =
      MULTILINE_HEIGHT + (lines > 1 ? lines * LINE_HEIGHT + PADDING : 0);

    animatedHeight.value = withTiming(newHeight, {
      duration: 200,
    });
  };

  // animation
  const pasteScaler = useSharedValue(1);
  const scanScaler = useSharedValue(1);
  const pasteBg = useSharedValue(1);
  const scanBg = useSharedValue(1);
  const pasteX = useSharedValue(0);
  const scanX = useSharedValue(0);
  const closeX = useSharedValue(70);
  const activeOpacity = useSharedValue(1);
  const animatedHeight = useSharedValue(MULTILINE_HEIGHT);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

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

      // Reset height when address is cleared
      animatedHeight.value = withTiming(MULTILINE_HEIGHT, {
        duration: 200,
      });
    }
  }, [address]);

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
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
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      minHeight: screenHeight * 0.063,
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
      paddingTop: screenHeight * 0.008,
      lineHeight: screenHeight * 0.025,
      height: 'auto',
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
      fontSize: screenHeight * 0.02,
      lineHeight: screenHeight * 0.025,
      textAlignVertical: 'top',
      opacity: 0,
    },
    icon: {
      width: 20,
      height: 18,
    },
  });

export default AddressField;
