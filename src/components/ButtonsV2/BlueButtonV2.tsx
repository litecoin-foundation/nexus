import React, {useContext, useMemo} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import TranslateText from '../TranslateText';
import {GLASS_BUTTON_TINT} from '../Buttons/GlassButtonSurface';
import {ScreenSizeContext} from '../../context/screenSize';

export const BUTTON_HEIGHT_RATIO = 0.06;

interface Props {
  textKey: string;
  textDomain: string;
  onPress: () => void;
  disabled?: boolean;
}

const BlueButtonV2: React.FC<Props> = props => {
  const {textKey, textDomain, onPress, disabled} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getStyles(SCREEN_HEIGHT), [SCREEN_HEIGHT]);

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
      onPressOut={onPressOut}
      style={styles.size}>
      <Animated.View
        style={[
          styles.size,
          styles.capsule,
          disabled ? styles.disabled : null,
          motionStyle,
        ]}>
        <TranslateText
          textKey={textKey}
          domain={textDomain}
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
          textStyle={styles.text}
          numberOfLines={1}
        />
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (screenHeight: number) =>
  StyleSheet.create({
    size: {
      width: '100%',
      height: screenHeight * BUTTON_HEIGHT_RATIO,
    },
    capsule: {
      borderRadius: screenHeight * 0.03,
      backgroundColor: GLASS_BUTTON_TINT,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 6,
          blurRadius: 16,
          // the tint at 30%: a blue glow sits better under the button than grey
          color: `${GLASS_BUTTON_TINT}4D`,
        },
      ],
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
  });

export default BlueButtonV2;
