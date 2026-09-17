import React, {useContext} from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {GlassRect, GLASS_FILTER_LABEL_GAP_RATIO} from '../glassSearchLayout';

const ICON_RATIO = 0.022;
const LABEL_FONT_RATIO = 0.015;
const PRESSED_OPACITY = 0.7;

interface Props {
  active: boolean;
  title?: string;
  textKey?: string;
  textDomain?: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
  tint?: boolean;
  rect: GlassRect;
}

const FilterButton: React.FC<Props> = props => {
  const {active, title, textKey, textDomain, onPress, imageSource, tint, rect} =
    props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_HEIGHT, tint);

  const labelStyle = [styles.text, active ? styles.textActive : null];

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.root,
        {left: rect.x, top: rect.y, width: rect.width},
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.iconArea, {height: rect.height}]}>
        <Image style={styles.image} source={imageSource} />
      </View>
      <View style={styles.labelWrap}>
        {title ? (
          <Text style={labelStyle} numberOfLines={1}>
            {title}
          </Text>
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * LABEL_FONT_RATIO}
            maxLengthInPixels={rect.width}
            textStyle={labelStyle}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
          />
        ) : (
          <></>
        )}
      </View>
    </Pressable>
  );
};

const getStyles = (screenHeight: number, tint?: boolean) =>
  StyleSheet.create({
    root: {
      position: 'absolute',
      alignItems: 'center',
    },
    iconArea: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: PRESSED_OPACITY,
    },
    labelWrap: {
      marginTop: screenHeight * GLASS_FILTER_LABEL_GAP_RATIO,
      alignItems: 'center',
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      color: '#ffffff',
      fontSize: screenHeight * LABEL_FONT_RATIO,
      textAlign: 'center',
    },
    textActive: {
      fontWeight: '700',
    },
    image: {
      height: screenHeight * ICON_RATIO,
      width: screenHeight * ICON_RATIO,
      resizeMode: 'contain',
      tintColor: tint ? '#ffffff' : undefined,
    },
  });

export default FilterButton;
