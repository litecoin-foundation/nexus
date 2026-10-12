import React, {useContext, useMemo} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import TranslateText from '../TranslateText';
import {BUTTON_HEIGHT_RATIO} from './BlueButtonV2';
import {PRIMARY_TEXT} from '../Cells/GlassCard';
import {ScreenSizeContext} from '../../context/screenSize';

// NOTE: the secondary button, white on the light sheets, so a hairline and a
// soft grey shadow, rather than a tinted glow, set it off them
export const WHITE_BUTTON_TINT = '#ffffff';
const WHITE_BUTTON_BORDER = 'rgba(60, 60, 67, 0.12)';

interface Props {
  textKey: string;
  textDomain: string;
  onPress: () => void;
  disabled?: boolean;
}

const WhiteButtonV2: React.FC<Props> = props => {
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
      backgroundColor: WHITE_BUTTON_TINT,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: WHITE_BUTTON_BORDER,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 6,
          blurRadius: 16,
          color: 'rgba(0, 0, 0, 0.08)',
        },
      ],
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.02,
    },
    disabled: {
      opacity: 0.5,
    },
  });

export default WhiteButtonV2;
