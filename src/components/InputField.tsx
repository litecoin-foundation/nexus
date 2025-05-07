import React, {useContext, useEffect, useState} from 'react';
import {View, TextInput, StyleSheet, Pressable, Image} from 'react-native';

import {ScreenSizeContext} from '../context/screenSize';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  clearInput: () => void;
}

const InputField: React.FC<Props> = props => {
  const {value, onChangeText, placeholder, onFocus, onBlur, clearInput} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [isActive, setActive] = useState(false);

  // animation
  const closeX = useSharedValue(70);

  const closeContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: withSpring(closeX.value, {stiffness: 50})}],
    };
  });

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
  }, [value]);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ? placeholder : undefined}
        placeholderTextColor="#dbdbdb"
        style={styles.text}
        onChangeText={text => onChangeText(text)}
        value={value}
        autoCorrect={false}
        autoComplete="off"
        onFocus={onFocus}
        onBlur={onBlur}
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
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      fontSize: screenHeight * 0.022,
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
  });

export default InputField;
