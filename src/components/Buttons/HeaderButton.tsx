import React, {useContext} from 'react';
import {
  StyleSheet,
  Image,
  ImageSourcePropType,
  View,
  TouchableOpacity,
} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
  imageSource?: ImageSourcePropType;
  title?: string;
  textKey?: string;
  textDomain?: string;
  rightPadding?: boolean;
  marginLeft?: number;
  marginRight?: number;
}

const HeaderButton: React.FC<Props> = props => {
  const {
    onPress,
    imageSource,
    title,
    textKey,
    textDomain,
    rightPadding,
    marginLeft,
    marginRight,
  } = props;

  const MARGIN_LEFT = marginLeft || 0;
  const MARGIN_RIGHT = marginRight || 0;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    MARGIN_LEFT,
    MARGIN_RIGHT,
  );

  const textStyle = imageSource
    ? {...styles.title, ...styles.titleWithImage}
    : styles.title;
  return (
    <TouchableOpacity
      style={[styles.container, rightPadding ? styles.padRight : null]}
      onPress={onPress}>
      <View style={styles.subcontainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} />
        ) : null}
        {textKey ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain || 'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : title ? (
          <TranslateText
            textValue={title}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={textStyle}
            numberOfLines={1}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  marginLeft: number,
  marginRight: number,
) =>
  StyleSheet.create({
    container: {
      borderRadius: screenHeight * 0.01,
      backgroundColor: 'rgba(216,216,216,0.2)',
      height: screenHeight * 0.035,
      minWidth: screenHeight * 0.035,
      minHeight: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: screenWidth * 0.04 + marginLeft,
    },
    subcontainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenHeight * 0.01,
      paddingVertical: screenHeight * 0.005,
    },
    image: {},
    title: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.013,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    titleWithImage: {
      marginLeft: screenHeight * 0.01,
    },
    padRight: {
      marginRight: screenWidth * 0.04 + marginRight,
    },
  });

export default HeaderButton;
