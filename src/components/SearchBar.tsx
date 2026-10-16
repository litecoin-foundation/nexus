import React, {useContext, useEffect, useState} from 'react';
import {View, TextInput, StyleSheet, Image, Pressable} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {SEGMENTED_PILLS_HEIGHT_RATIO} from './ButtonsV2/SegmentedPills';
import {ScreenSizeContext} from '../context/screenSize';

const LIGHT_SURFACE = '#ffffff';
const LIGHT_BORDER = '#e8e8e8';
const LIGHT_PLACEHOLDER = '#2e2e2e65';
const LIGHT_ICON = '#A7A7A7';
const DARK_SURFACE = '#aeb5bc';
const DARK_HINT = '#ffffffbf';
const DARK_FADE = {duration: 400, easing: Easing.inOut(Easing.quad)};

interface Props {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  noShadow?: boolean;
  borderRadius?: number;
  inputRef?: React.Ref<TextInput>;
  dark?: boolean;
}

const SearchBar: React.FC<Props> = props => {
  const {
    value,
    onChangeText,
    placeholder,
    noShadow,
    borderRadius,
    inputRef,
    dark = false,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, {
    noShadow,
    borderRadius,
  });

  const darkness = useSharedValue(dark ? 1 : 0);
  useEffect(() => {
    darkness.value = withTiming(dark ? 1 : 0, DARK_FADE);
  }, [dark, darkness]);
  const surfaceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      darkness.value,
      [0, 1],
      [LIGHT_SURFACE, DARK_SURFACE],
    ),
  }));
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      darkness.value,
      [0, 1],
      [LIGHT_BORDER, DARK_SURFACE],
    ),
  }));

  const [isActive, setActive] = useState(false);

  const closeX = useSharedValue(70);

  const closeContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: withSpring(closeX.value, {stiffness: 200})}],
    };
  });

  useEffect(() => {
    if (value !== '') {
      setActive(true);
      closeX.value = 0;
    } else {
      setActive(false);
      closeX.value = 80;
    }
  }, [value, closeX]);

  return (
    <Animated.View style={[styles.shadowContainer, surfaceStyle]}>
      <Animated.View style={[styles.container, borderStyle]}>
        <View style={styles.imageContainer}>
          <Image
            style={[styles.image, dark ? styles.imageDark : null]}
            source={require('../assets/icons/search-icon.png')}
          />
        </View>
        <TextInput
          ref={inputRef}
          placeholder={placeholder ? placeholder : undefined}
          placeholderTextColor={dark ? DARK_HINT : LIGHT_PLACEHOLDER}
          style={[styles.text, dark ? styles.textDark : null]}
          onChangeText={text => onChangeText(text)}
          value={value}
          autoCorrect={false}
          autoComplete="off"
          allowFontScaling={false}
          keyboardAppearance={dark ? 'dark' : 'default'}
        />

        {!isActive ? null : (
          <Pressable
            style={styles.closeContainer}
            disabled={!isActive}
            onPress={() => {
              onChangeText('');
            }}>
            <Animated.View
              style={[
                styles.closeSubContainer,
                dark ? styles.closeSubContainerDark : null,
                closeContainerMotionStyle,
              ]}>
              <Image
                style={styles.closeIcon}
                source={
                  dark
                    ? require('../assets/images/close-white.png')
                    : require('../assets/images/close.png')
                }
              />
            </Animated.View>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export const SEARCH_BAR_HEIGHT_RATIO = SEGMENTED_PILLS_HEIGHT_RATIO;
const ICON_BOX_RATIO = 0.038;

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  options?: {noShadow?: boolean; borderRadius?: number},
) => {
  const barHeight = screenHeight * SEARCH_BAR_HEIGHT_RATIO;
  const iconBox = screenHeight * ICON_BOX_RATIO;
  const br = options?.borderRadius ?? barHeight / 2;
  return StyleSheet.create({
    shadowContainer: {
      width: '100%',
      height: barHeight,
      borderRadius: br,
      backgroundColor: LIGHT_SURFACE,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: options?.noShadow ? 0 : 0.07,
      shadowRadius: 4,
    },
    container: {
      flex: 1,
      borderRadius: br,
      borderColor: LIGHT_BORDER,
      borderWidth: 1,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.006,
    },
    imageContainer: {
      width: iconBox,
      height: iconBox,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '50%',
      height: '50%',
      objectFit: 'scale-down',
      tintColor: LIGHT_ICON,
    },
    imageDark: {
      tintColor: DARK_HINT,
    },
    text: {
      flex: 1,
      color: '#47516B',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
      fontSize: screenHeight * 0.02,
      marginLeft: screenWidth * 0.01,
    },
    textDark: {
      color: '#ffffff',
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
    closeSubContainerDark: {
      backgroundColor: '#333333',
    },
    closeIcon: {
      width: 8,
      height: 8,
    },
  });
};

export default SearchBar;
