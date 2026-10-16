import React, {useContext, useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';

import TranslateText from '../TranslateText';
import {BUTTON_HEIGHT_RATIO} from './BlueButtonV2';
import {GLASS_BUTTON_TINT} from '../Buttons/GlassButtonSurface';
import {PRIMARY_TEXT} from '../Cells/GlassCard';
import {ScreenSizeContext} from '../../context/screenSize';

// NOTE: the secondary button for actions on a cooldown, grey on the white
// sheets, so the fill alone sets it off them. It stays locked while its timer
// runs, the seconds left counting down on a ring held in its left cap.
export const GRAY_BUTTON_TINT = '#F2F2F7';
const RING_TRACK = `${GLASS_BUTTON_TINT}26`;

// Height fractions
const RING_SIZE_RATIO = 0.035;
const RING_FONT_RATIO = 0.0135;
const RING_STROKE = 3;

interface RingProps {
  size: number;
  progress: number;
}

const CountdownRing: React.FC<RingProps> = props => {
  const {size, progress} = props;

  const viewBoxSize = size + RING_STROKE * 2;
  const center = viewBoxSize / 2;
  const radius = (size - RING_STROKE) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      <Circle
        stroke={RING_TRACK}
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={RING_STROKE}
      />
      <Circle
        stroke={GLASS_BUTTON_TINT}
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={RING_STROKE}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
};

interface Props {
  textKey: string;
  textDomain: string;
  onPress: () => void;
  seconds: number;
  totalSeconds: number;
  disabled?: boolean;
}

const TimerGrayButtonV2: React.FC<Props> = props => {
  const {textKey, textDomain, onPress, seconds, totalSeconds, disabled} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = useMemo(() => getStyles(SCREEN_HEIGHT), [SCREEN_HEIGHT]);

  const counting = seconds > 0;

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
      disabled={disabled || counting}
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
        <View style={counting ? styles.disabled : null}>
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.022}
            textStyle={styles.text}
            numberOfLines={1}
          />
        </View>
        {counting ? (
          <View style={styles.ring}>
            <CountdownRing
              size={SCREEN_HEIGHT * RING_SIZE_RATIO}
              progress={totalSeconds > 0 ? seconds / totalSeconds : 0}
            />
            <View style={styles.ringLabel}>
              <TranslateText
                textValue={String(seconds)}
                maxSizeInPixels={SCREEN_HEIGHT * RING_FONT_RATIO}
                textStyle={styles.ringText}
                numberOfLines={1}
              />
            </View>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (screenHeight: number) => {
  const buttonHeight = screenHeight * BUTTON_HEIGHT_RATIO;
  const ringSize = screenHeight * RING_SIZE_RATIO;
  return StyleSheet.create({
    size: {
      width: '100%',
      height: buttonHeight,
    },
    capsule: {
      borderRadius: screenHeight * 0.03,
      backgroundColor: GRAY_BUTTON_TINT,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.02,
    },
    ring: {
      position: 'absolute',
      left: (buttonHeight - ringSize) / 2,
      width: ringSize,
      height: ringSize,
    },
    ringLabel: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: GLASS_BUTTON_TINT,
      fontSize: screenHeight * RING_FONT_RATIO,
    },
    disabled: {
      opacity: 0.5,
    },
  });
};

export default TimerGrayButtonV2;
