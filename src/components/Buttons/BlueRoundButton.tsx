import React, {useContext} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

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
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BlueRoundButton: React.FC<Props> = props => {
  const {value, textKey, textDomain, onPress, disabled, loading, style} = props;

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
      disabled={disabled || loading}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.container,
          disabled ? styles.disabled : null,
          motionStyle,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : value ? (
          <TranslateText
            textValue={value}
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.text}
            numberOfLines={1}
          />
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
      width: '100%',
      height: screenHeight * 0.06,
      backgroundColor: '#0070F0',
      borderRadius: screenHeight * 0.03,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.016,
      paddingHorizontal: screenHeight * 0.024,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#FFFFFF',
      fontSize: screenHeight * 0.018,
    },
    disabled: {
      opacity: 0.5,
    },
  });

export default BlueRoundButton;
