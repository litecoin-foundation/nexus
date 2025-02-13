import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  textKey: string;
  domain: string;
  maxSizeInPixels?: number;
  maxLengthInPixels?: number;
  textStyle?: any;
  numberOfLines?: number;
}

const DEFAULT_FONT_SIZE = 20;

const TranslateText: React.FC<Props> = props => {
  const {
    textKey,
    domain,
    maxSizeInPixels,
    maxLengthInPixels,
    textStyle,
    numberOfLines,
  } = props;

  const {width, height} = useContext(ScreenSizeContext);

  let fontSize = textStyle ? textStyle.fontSize : DEFAULT_FONT_SIZE;
  if (maxSizeInPixels && fontSize > maxSizeInPixels) {
    fontSize = maxSizeInPixels;
  }

  const styles = getStyles(width, height, fontSize, maxLengthInPixels);

  const {t} = useTranslation(domain);

  return (
    <View style={styles.container}>
      <Text
        style={[styles.text, textStyle, styles.textLimits]}
        ellipsizeMode="tail"
        numberOfLines={numberOfLines || 0}>
        {t(textKey)}
      </Text>
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
      fontSize: fontSize,
    },
  });

export default TranslateText;
