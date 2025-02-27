import React, {useContext} from 'react';
import {Text, StyleSheet, Pressable} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  value?: string;
  textKey?: string;
  textDomain?: string;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
}

const GreenButton: React.FC<Props> = props => {
  const {value, textKey, textDomain, onPress, disabled, small} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // animation
  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.96, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.container,
          small ? styles.small : styles.big,
          disabled ? styles.disabled : null,
          motionStyle,
        ]}>
        {value ? (
          <Text style={styles.text}>{value}</Text>
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.text}
            numberOfLines={1}
          />
        ) : (
          <></>
        )}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      height: screenHeight * 0.055,
      backgroundColor: '#20BB74',
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    small: {
      width: screenWidth * 0.7,
      height: screenHeight * 0.055,
      borderRadius: screenHeight * 0.01,
    },
    big: {
      width: '100%',
      height: screenHeight * 0.06,
      borderRadius: screenHeight * 0.012,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#fff',
      fontSize: screenHeight * 0.02,
    },
    disabled: {
      opacity: 0.5,
    },
    smallText: {
      fontSize: screenHeight * 0.017,
    },
  });

export default GreenButton;
