import React, {useContext} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  textKey: string;
  domain: string;
  maxSizeInPixels?: number;
  maxLengthInPixels?: number;
  textStyle?: any;
  animatedProps?: any;
  numberOfLines?: number;
  interpolationObj?: {
    [key: string]: any;
  };
  children?: any;
}

const DEFAULT_FONT_SIZE = 20;

const TranslateText: React.FC<Props> = props => {
  const {
    textKey,
    domain,
    maxSizeInPixels,
    maxLengthInPixels,
    textStyle,
    animatedProps,
    numberOfLines,
    interpolationObj,
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

  const styles = getStyles(width, height, fontSize, maxLengthInPixels);

  const {t} = useTranslation(domain);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.text, textStyle, styles.textLimits, animatedProps]}
        ellipsizeMode="tail"
        numberOfLines={numberOfLines || 0}>
        {t(textKey, interpolationObj)}
        {children}
      </Animated.Text>
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  fontSize: number,
  maxLengthInPixels: number | undefined,
) =>
  StyleSheet.create({
    container: {
      maxWidth: maxLengthInPixels || '100%',
    },
    text: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
    },
    textLimits: {
      width: '100%',
      maxWidth: '100%',
      fontSize: fontSize,
      flexWrap: 'wrap',
    },
  });

export default TranslateText;
