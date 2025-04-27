import React, {useContext} from 'react';
import {StyleSheet, Dimensions, Pressable} from 'react-native';
import Animated from 'react-native-reanimated';
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
  numberOfLines?: number;
  interpolationObj?: {
    [key: string]: any;
  };
  onPress?: () => void;
  children?: any;
}

const DEFAULT_FONT_SIZE = 20;

const TranslateText: React.FC<Props> = props => {
  const {
    textValue,
    textKey,
    domain,
    maxSizeInPixels,
    maxLengthInPixels,
    textStyle,
    animatedProps,
    numberOfLines,
    interpolationObj,
    onPress,
    children,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);

  let fontSize =
    textStyle && textStyle.hasOwnProperty('fontSize')
      ? textStyle.fontSize
      : DEFAULT_FONT_SIZE;

  if (
    maxSizeInPixels &&
    fontSize * Dimensions.get('window').fontScale > maxSizeInPixels
  ) {
    fontSize = maxSizeInPixels / Dimensions.get('window').fontScale;
  }

  const textFlexBasis =
    textStyle && textStyle.hasOwnProperty('flexBasis')
      ? textStyle.flexBasis
      : undefined;

  const styles = getStyles(
    width,
    height,
    fontSize,
    maxLengthInPixels,
    textFlexBasis,
  );

  const {t} = useTranslation(domain);

  return onPress ? (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          textStyle,
          styles.textLimits,
          animatedProps,
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
          animatedProps,
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
    },
  });

export default TranslateText;
