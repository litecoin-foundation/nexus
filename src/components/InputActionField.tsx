import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  interpolateColor,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  Text,
  interpolateColors,
  matchFont,
  useFont,
} from '@shopify/react-native-skia';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  clearInput: () => void;
  onAction: () => void;
}

const InputActionField: React.FC<Props> = props => {
  const {
    value,
    onChangeText,
    placeholder,
    onFocus,
    onBlur,
    clearInput,
    onAction,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const fontSize = SCREEN_HEIGHT * 0.018;
  const fontStyle = {
    fontFamily: 'Satoshi Variable',
    fontSize: fontSize,
    fontStyle: 'normal',
    fontWeight: '600',
  } as const;
  const font = Platform.select({
    ios: matchFont(fontStyle),
    default: useFont(require('../fonts/Satoshi-Variable.ttf'), 16),
  });

  const [isActive, setActive] = useState(false);

  // animation
  const closeX = useSharedValue(70);
  const buttonColor = useSharedValue(0);
  const scaler = useSharedValue(1);

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };
  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  const closeContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: withSpring(closeX.value, {stiffness: 50})}],
    };
  });

  const buttonStyle = useAnimatedProps(() => {
    const borderColorIterpolation = interpolateColor(
      buttonColor.value,
      [0, 1],
      ['rgba(216, 210, 210, 0.75)', '#fff'],
    );
    const bgColorIterpolation = interpolateColor(
      buttonColor.value,
      [0, 1],
      ['transparent', '#20BB74'],
    );
    return {
      borderColor: borderColorIterpolation,
      backgroundColor: bgColorIterpolation,
      transform: [{scale: scaler.value}],
    };
  });

  const interpolatedColour = useDerivedValue(
    () => interpolateColors(buttonColor.value, [0, 1], ['#4a4a4a', '#fff']),
    [buttonColor],
  );

  useEffect(() => {
    if (value !== '') {
      // AddressField is active
      setActive(true);
      closeX.value = 0;
    } else {
      // AddressField is inactive (empty)
      setActive(false);
      closeX.value = 80;
    }
  }, [value, closeX]);

  function handleAction() {
    buttonColor.value = withTiming(1, {duration: 100});
    onAction();
  }

  function handleOnChangeText(text: string) {
    buttonColor.value = withTiming(0, {duration: 100});
    onChangeText(text);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={placeholder ? placeholder : undefined}
          placeholderTextColor="#dbdbdb"
          style={styles.text}
          onChangeText={text => handleOnChangeText(text)}
          value={value}
          autoCorrect={false}
          autoComplete="off"
          onFocus={onFocus}
          onBlur={() => {
            onBlur();
            handleAction();
          }}
          maxLength={22}
        />

        {!isActive ? null : (
          <Pressable
            style={styles.closeContainer}
            disabled={!isActive}
            onPress={() => {
              clearInput();
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

      <Animated.View style={[styles.actionBtnContainer, buttonStyle]}>
        <Pressable
          style={styles.actionBtn}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => {
            handleAction();
          }}>
          <Canvas style={styles.canvasContainer}>
            <Text
              text="OK"
              x={(SCREEN_WIDTH * 0.12) / 2 - fontSize * 0.8}
              y={(SCREEN_HEIGHT * 0.05) / 2 + fontSize * 0.3}
              font={font}
              color={interpolatedColour}
            />
          </Canvas>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      minHeight: screenHeight * 0.06,
      height: screenHeight * 0.06,
      borderRadius: screenHeight * 0.01,
      borderColor: '#E8E8E8',
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenHeight * 0.005,
      paddingVertical: screenHeight * 0.005,
    },
    inputContainer: {
      flexBasis: '85%',
      justifyContent: 'center',
    },
    actionBtnContainer: {
      width: screenWidth * 0.12,
      height: screenHeight * 0.05,
      borderWidth: 1,
      borderColor: 'rgba(216, 210, 210, 0.75)',
      borderRadius: screenHeight * 0.01,
    },
    actionBtn: {
      width: '100%',
      height: '100%',
    },
    okText: {
      color: '#4a4a4a',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontSize: screenHeight * 0.018,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    text: {
      color: '#4a4a4a',
      fontSize: screenHeight * 0.018,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
    },
    closeContainer: {
      right: 0,
      position: 'absolute',
      marginRight: screenWidth * 0.01,
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
    canvasContainer: {
      flex: 1,
    },
  });

export default InputActionField;
