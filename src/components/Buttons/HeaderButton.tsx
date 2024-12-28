import React, {useContext} from 'react';
import {
  StyleSheet,
  Image,
  ImageSourcePropType,
  Text,
  Platform,
  View,
  TouchableOpacity,
} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  onPress: () => void;
  imageSource?: ImageSourcePropType;
  title?: string;
  rightPadding?: boolean;
  marginLeft?: number;
  marginRight?: number;
}

const HeaderButton: React.FC<Props> = props => {
  const {onPress, imageSource, title, rightPadding, marginLeft, marginRight} = props;

  const MARGIN_LEFT = marginLeft || 0;
  const MARGIN_RIGHT = marginRight || 0;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, MARGIN_LEFT, MARGIN_RIGHT);

  return (
    <TouchableOpacity
      style={[styles.container, rightPadding ? styles.padRight : null]}
      onPress={onPress}>
      <View style={styles.subcontainer}>
        {imageSource ? <Image source={imageSource} style={styles.image} /> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, marginLeft: number, marginRight: number) =>
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
      paddingHorizontal: screenHeight * 0.01,
      paddingVertical: screenHeight * 0.005,
      flexDirection: 'row',
      alignItems: 'center',
    },
    image: {
    },
    title: {
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: screenHeight * 0.013,
      marginLeft: 5,
      marginRight: 5,
    },
    padRight: {
      marginRight: screenWidth * 0.04 + marginRight,
    },
  });

export default HeaderButton;
