import React, {useContext, useEffect, useState} from 'react';
import {View, TextInput, StyleSheet, Image, Pressable} from 'react-native';
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
  noShadow?: boolean;
  borderRadius?: number;
}

const SearchBar: React.FC<Props> = props => {
  const {value, onChangeText, placeholder, noShadow, borderRadius} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, {
    noShadow,
    borderRadius,
  });

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
    <View style={styles.shadowContainer}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={require('../assets/icons/search-icon.png')}
          />
        </View>
        <TextInput
          placeholder={placeholder ? placeholder : undefined}
          placeholderTextColor="#2e2e2e65"
          style={styles.text}
          onChangeText={text => onChangeText(text)}
          value={value}
          autoCorrect={false}
          autoComplete="off"
          allowFontScaling={false}
        />

        {!isActive ? null : (
          <Pressable
            style={styles.closeContainer}
            disabled={!isActive}
            onPress={() => {
              onChangeText('');
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

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  options?: {noShadow?: boolean; borderRadius?: number},
) => {
  const br = options?.borderRadius ?? screenHeight * 0.01;
  return StyleSheet.create({
    shadowContainer: {
      width: '100%',
      height: screenHeight * 0.05,
      borderRadius: br,
      backgroundColor: '#fff',
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
      borderColor: '#e8e8e8',
      borderWidth: 1,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.006,
    },
    imageContainer: {
      width: screenHeight * 0.038,
      height: screenHeight * 0.038,
      borderRadius: br * 0.8,
      backgroundColor: '#d8d8d833',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '50%',
      height: '50%',
      objectFit: 'scale-down',
    },
    text: {
      flex: 1,
      color: '#47516B',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
      fontSize: screenHeight * 0.02,
      marginLeft: screenHeight * 0.01,
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
};

export default SearchBar;
