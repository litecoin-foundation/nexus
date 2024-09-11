import React from 'react';
import {
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';

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
  imageSource?: ImageSourcePropType;
}

const BuyButton: React.FC<Props> = props => {
  const {value, onPress, disabled, imageSource} = props;
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
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      onPress={() => {
        triggerSelectionFeedback();
        onPress();
      }}>
      <Animated.View style={[styles.button, motionStyle]}>
        {imageSource ? (
          <Image style={styles.image} source={imageSource} />
        ) : (
          <Text style={styles.text}>{value}</Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
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
    width: 125,
    height: 96,
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#293C62',
    fontSize: 24,
  },
  image: {
    tintColor: '#293C62',
  },
});

export default BuyButton;
