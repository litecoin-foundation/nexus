import React, {useContext, useMemo} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import TranslateText from '../TranslateText';
import {BUTTON_HEIGHT_RATIO} from './BlueButtonV2';
import {WHITE_BUTTON_TINT} from './WhiteButtonV2';
import {ScreenSizeContext} from '../../context/screenSize';

// NOTE: The secondary button on the blue gradient, where neither the blue
// button nor the white one reads as secondary: a frosted capsule with a white
// label. Selected, it turns solid white, like the header's active toggle.
const CLEAR_BUTTON_TINT = 'rgba(255, 255, 255, 0.12)';
const CLEAR_BUTTON_BORDER = 'rgba(238, 235, 235, 0.45)';
const SELECTED_LABEL_COLOR = '#2C72FF';

interface Props {
  textKey?: string;
  textDomain?: string;
  textValue?: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}

const WhiteClearButtonV2: React.FC<Props> = props => {
  const {textKey, textDomain, textValue, onPress, disabled, selected} = props;

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
          selected ? styles.selected : null,
          disabled ? styles.disabled : null,
          motionStyle,
        ]}>
        <TranslateText
          textKey={textKey}
          domain={textDomain}
          textValue={textValue}
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
          textStyle={[styles.text, selected ? styles.selectedText : null]}
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
      borderCurve: 'continuous',
      backgroundColor: CLEAR_BUTTON_TINT,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLEAR_BUTTON_BORDER,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.025,
    },
    selected: {
      backgroundColor: WHITE_BUTTON_TINT,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#fff',
      fontSize: screenHeight * 0.02,
    },
    selectedText: {
      color: SELECTED_LABEL_COLOR,
    },
    disabled: {
      opacity: 0.5,
    },
  });

export default WhiteClearButtonV2;
