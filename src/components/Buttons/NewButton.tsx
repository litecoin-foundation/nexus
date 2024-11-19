import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  imageSource: ImageSourcePropType;
  onPress: () => void;
}

const NewButton: React.FC<Props> = props => {
  const {imageSource, onPress} = props;
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
        <Image source={imageSource} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216, 210, 210, 0.75)',
    backgroundColor: '#fefefe',
    width: 60,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default NewButton;
