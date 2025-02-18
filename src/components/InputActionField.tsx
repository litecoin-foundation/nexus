import React, {useContext, useEffect, useState} from 'react';
import {View, TextInput, StyleSheet, Pressable, Image} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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

  const [isActive, setActive] = useState(false);

  // animation
  const closeX = useSharedValue(100);

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
      closeX.value = 100;
    }
  }, [value, closeX]);

  function handleAction() {
    onAction();
  }

  function handleOnChangeText(text: string) {
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
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      minHeight: screenHeight * 0.06,
      height: screenHeight * 0.06,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
    },
    inputContainer: {
      flexBasis: '100%',
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
      height: screenHeight * 0.04,
      width: screenHeight * 0.04,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeSubContainer: {
      width: '80%',
      height: '80%',
      borderRadius: '50%',
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
