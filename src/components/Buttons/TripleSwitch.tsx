import React, {useContext} from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

const to75Transparent = (color: string): string => {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, '0.75)');
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', ', 0.75)');
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map(c => c + c)
            .join('')
        : hex.slice(0, 6);
    return `#${fullHex}BF`;
  }
  return color;
};

interface TripleSwitchProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  width?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
  activeTextColor?: string;
}

const TripleSwitch: React.FC<TripleSwitchProps> = ({
  options,
  selectedIndex,
  onSelectionChange,
  width = 300,
  height = 40,
  activeColor = '#2C72FF',
  inactiveColor = '#F5F5F5',
  textColor = '#666',
  activeTextColor = '#FFFFFF',
}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    to75Transparent(inactiveColor),
    height / 2,
  );

  const animatedIndex = useSharedValue(selectedIndex);

  React.useEffect(() => {
    animatedIndex.value = withSpring(selectedIndex, {
      damping: 50,
      stiffness: 500,
    });
  }, [selectedIndex, animatedIndex]);

  const buttonWidth = width / options.length;

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: animatedIndex.value * buttonWidth,
        },
      ],
    };
  });

  return (
    <View style={[styles.container, {width, height}]}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: buttonWidth,
            height,
            backgroundColor: activeColor,
          },
          indicatorStyle,
        ]}
      />
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.button, {width: buttonWidth}]}
          onPress={() => onSelectionChange(index)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.buttonText,
              {color: index === selectedIndex ? activeTextColor : textColor},
            ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  inactiveColor: string,
  buttonRadius: number,
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: inactiveColor,
      borderRadius: buttonRadius,
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      borderRadius: buttonRadius,
      top: 0,
      left: 0,
    },
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      zIndex: 1,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
    },
  });

export default TripleSwitch;
