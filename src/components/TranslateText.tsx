import React, {useContext} from 'react';
import {StyleSheet, Dimensions, Pressable} from 'react-native';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  textValue?: string;
  textKey?: string;
  domain?: string;
  maxSizeInPixels?: number;
  maxLengthInPixels?: number;
  textStyle?: any;
  animatedProps?: any;
  animatedFontSizeValue?: any;
  numberOfLines?: number;
  interpolationObj?: {
    [key: string]: any;
  };
  onPress?: () => void;
  children?: any;
}

const DEFAULT_FONT_SIZE = 20;
const FONT_SCALE = Dimensions.get('window').fontScale;

const TranslateText: React.FC<Props> = props => {
  const {
    textValue,
    textKey,
    domain,
    maxSizeInPixels,
    maxLengthInPixels,
    textStyle,
    animatedProps,
    animatedFontSizeValue,
    numberOfLines,
    interpolationObj,
    onPress,
    children,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);

  const flatStyle = textStyle ? StyleSheet.flatten(textStyle) : undefined;

  let fontSize =
    flatStyle && flatStyle.fontSize ? flatStyle.fontSize : DEFAULT_FONT_SIZE;

  if (maxSizeInPixels && fontSize * FONT_SCALE > maxSizeInPixels) {
    fontSize = maxSizeInPixels / FONT_SCALE;
  }

  const textFlexBasis =
    flatStyle && flatStyle.flexBasis ? flatStyle.flexBasis : undefined;

  const styles = getStyles(
    width,
    height,
    fontSize,
    maxLengthInPixels,
    textFlexBasis,
  );

  const overrideFontSizeWithAnimated = useAnimatedStyle(() => {
    return {
      fontSize: animatedFontSizeValue
        ? animatedFontSizeValue.value / FONT_SCALE
        : fontSize,
    };
  });

  const animatedStyle = animatedFontSizeValue
    ? overrideFontSizeWithAnimated
    : animatedProps
      ? animatedProps
      : null;

  const {t} = useTranslation(domain);

  return onPress ? (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          textStyle,
          styles.textLimits,
          animatedStyle,
          {includeFontPadding: false},
        ]}
        ellipsizeMode="tail"
        numberOfLines={numberOfLines || 0}>
        {textValue ? textValue : textKey ? t(textKey, interpolationObj) : ''}
        {children}
      </Animated.Text>
    </Pressable>
  ) : (
    <Animated.View style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          textStyle,
          styles.textLimits,
          animatedStyle,
          {includeFontPadding: false},
        ]}
        ellipsizeMode="tail"
        numberOfLines={numberOfLines || 0}>
        {textValue ? textValue : textKey ? t(textKey, interpolationObj) : ''}
        {children}
      </Animated.Text>
    </Animated.View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  fontSize: number,
  maxLengthInPixels: number | undefined,
  textFlexBasis: number | undefined,
) =>
  StyleSheet.create({
    container: {
      flexBasis: textFlexBasis,
      maxWidth: maxLengthInPixels || '100%',
    },
    text: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
    },
    textLimits: {
      fontSize: fontSize,
      flexBasis: null,
      // width: '100%',
    },
  });

export default TranslateText;
