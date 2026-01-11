import React, {useContext} from 'react';
import {Pressable, StyleSheet} from 'react-native';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  title?: string;
  textKey?: string;
  textDomain?: string;
  active: boolean;
  onPress: () => void;
  autoWidth?: boolean;
}

const NewBlueButton: React.FC<Props> = props => {
  const {title, textKey, textDomain, active, onPress, autoWidth} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, autoWidth || false);

  const textStyle = active
    ? {
        ...styles.text,
        ...styles.activeText,
      }
    : styles.text;

  // animation
  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.93, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[styles.container, active ? styles.active : null, motionStyle]}>
        {title ? (
          <TranslateText
            textValue={title}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : (
          <></>
        )}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  autoWidth: boolean,
) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.044,
      minWidth: autoWidth ? 'auto' : screenHeight * 0.15,
      borderRadius: screenHeight * 0.012,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FEFEFE',
      borderWidth: 1,
      borderColor: 'rgba(216,210,210,75)',
      paddingHorizontal: autoWidth ? screenWidth * 0.04 : screenWidth * 0.02,
    },
    active: {
      backgroundColor: '#2C72FF',
      borderWidth: 0,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.017,
    },
    activeText: {
      color: '#FFFFFF',
    },
  });

export default NewBlueButton;
