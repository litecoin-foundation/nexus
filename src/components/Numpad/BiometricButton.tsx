import React from 'react';
import {TouchableWithoutFeedback, Image, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {useAppSelector} from '../../store/hooks';

interface Props {
  onPress: () => void;
}

const Button: React.FC<Props> = props => {
  const {onPress} = props;
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
      style={[styles.container, !biometricsEnabled ? styles.disabled : null]}>
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={!biometricsEnabled}>
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

const styles = StyleSheet.create({
  container: {
    width: '33%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 72,
    borderRadius: 72 / 2,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  image: {
    height: 30,
    width: 30,
  },
  disabled: {
    opacity: 0,
  },
});

export default Button;
