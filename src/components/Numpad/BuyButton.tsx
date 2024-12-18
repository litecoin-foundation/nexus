import React, {useContext} from 'react';
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

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
  imageSource?: ImageSourcePropType;
}

const BuyButton: React.FC<Props> = props => {
  const {value, onPress, disabled, imageSource} = props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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
        if (!disabled) {
          triggerSelectionFeedback();
          onPress();
        }
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

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    button: {
      width: screenWidth / 3,
      height: screenHeight * 0.1,
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
      color: '#293C62',
      fontSize: screenHeight * 0.024,
    },
    image: {
      tintColor: '#293C62',
    },
});

export default BuyButton;
