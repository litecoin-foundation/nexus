import React, {useContext} from 'react';
import {TouchableWithoutFeedback, Image, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<Props> = props => {
  const {onPress, disabled} = props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const scaler = useSharedValue(1);

  const biometricsEnabled = useAppSelector(
    state => state.authentication!.biometricsEnabled,
  );
  const biometricType = useAppSelector(
    state => state.authentication!.faceIDSupported,
  );

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.85, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 1});
  };

  return (
    <View
      style={!biometricsEnabled ? styles.disabled : null}>
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={!biometricsEnabled || disabled}>
        <Animated.View style={[styles.button, motionStyle]}>
          <Image
            source={
              biometricType === true
                ? require('../../assets/images/face-id-blue.png')
                : require('../../assets/images/touch-id-blue.png')
            }
            style={styles.image}
          />
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    button: {
      width: screenWidth / 3,
      height: screenHeight * 0.1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      height: screenHeight * 0.03,
      width: screenHeight * 0.03,
      tintColor: '#293C62',
      marginLeft: screenHeight * 0.014,
      marginBottom: screenHeight * 0.02,
    },
    disabled: {
      opacity: 0,
    },
  });

export default Button;
