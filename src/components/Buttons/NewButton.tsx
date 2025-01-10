import React, {useContext} from 'react';
import {Image, ImageSourcePropType, StyleSheet, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  imageSource: ImageSourcePropType;
  onPress: () => void;
  small?: boolean;
}

const NewButton: React.FC<Props> = props => {
  const {imageSource, onPress, small} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, small);

  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Animated.View style={[styles.container, motionStyle]}>
        <Image style={styles.image} source={imageSource} />
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  small: boolean | undefined,
) =>
  StyleSheet.create({
    container: {
      borderRadius: screenHeight * 0.012,
      borderWidth: 1,
      borderColor: 'rgba(216, 210, 210, 0.75)',
      backgroundColor: '#fefefe',
      width: small ? screenHeight * 0.055 : screenHeight * 0.067,
      height: small ? screenHeight * 0.045 : screenHeight * 0.055,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: small ? screenHeight * 0.045 : screenHeight * 0.057,
      objectFit: 'contain',
    },
  });

export default NewButton;
