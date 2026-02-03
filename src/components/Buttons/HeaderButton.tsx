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
  leftPadding?: boolean;
  rightPadding?: boolean;
  marginLeft?: number;
  marginRight?: number;
  imageXY?: {
    x: number;
    y: number;
  };
  backgroundColorSpecified?: string;
}

const HeaderButton: React.FC<Props> = props => {
  const {
    onPress,
    imageSource,
    title,
    textKey,
    textDomain,
    leftPadding,
    rightPadding,
    marginLeft,
    marginRight,
    imageXY,
    backgroundColorSpecified,
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
    imageXY,
    !title && !textKey,
    backgroundColorSpecified,
  );

  const textStyle = imageSource
    ? {...styles.title, ...styles.titleWithImage}
    : styles.title;
  return (
    <TouchableOpacity
      style={[
        styles.container,
        leftPadding ? styles.padLeft : null,
        rightPadding ? styles.padRight : null,
      ]}
      onPress={onPress}>
      <View style={styles.subcontainer}>
        {imageSource ? (
          <Image source={imageSource} style={imageXY ? styles.image : null} />
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
  imageXY:
    | {
        x: number;
        y: number;
      }
    | undefined,
  onlyImage: boolean,
  backgroundColorSpecified?: string,
) =>
  StyleSheet.create({
    container: {
      borderRadius: screenHeight * 0.01,
      backgroundColor: backgroundColorSpecified || 'rgba(216,216,216,0.2)',
      height: screenHeight * 0.035,
      minWidth: screenHeight * 0.035,
      minHeight: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    padLeft: {
      marginLeft: screenWidth * 0.04 + marginLeft,
    },
    padRight: {
      marginRight: screenWidth * 0.04 + marginRight,
    },
    subcontainer: {
      height: '100%',
      minWidth: screenHeight * 0.035,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: onlyImage ? screenWidth * 0.01 : screenWidth * 0.02,
    },
    image: {
      width: imageXY ? imageXY.x : screenHeight * 0.035,
      height: imageXY ? imageXY.y : '100%',
      objectFit: 'cover',
    },
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
  });

export default HeaderButton;
