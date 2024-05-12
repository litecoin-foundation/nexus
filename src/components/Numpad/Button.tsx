import React from 'react';
import {TouchableWithoutFeedback, Text, StyleSheet, View} from 'react-native';

import {triggerSelectionFeedback} from '../../lib/utils/haptic';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<Props> = props => {
  const {value, onPress, disabled} = props;
  const scaler = useSharedValue(1);

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
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        onPress={() => {
          triggerSelectionFeedback();
          onPress();
        }}>
        <Animated.View
          style={[
            styles.button,
            disabled ? styles.disabled : null,
            motionStyle,
          ]}>
          <Text style={styles.text}>{value}</Text>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C72FF',
  },
  disabled: {
    opacity: 0,
  },
});

export default Button;
