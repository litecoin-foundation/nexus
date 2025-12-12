import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

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
  const animatedIndex = useSharedValue(selectedIndex);

  React.useEffect(() => {
    animatedIndex.value = withSpring(selectedIndex, {
      damping: 20,
      stiffness: 200,
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

  const getTextStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const isSelected = interpolate(
        animatedIndex.value,
        [index - 0.5, index, index + 0.5],
        [0, 1, 0],
        'clamp',
      );

      const color = interpolateColor(
        isSelected,
        [0, 1],
        [textColor, activeTextColor],
      );

      return {
        color,
      };
    });
  };

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
          <Animated.Text style={[styles.buttonText, getTextStyle(index)]}>
            {option}
          </Animated.Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    borderRadius: 20,
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