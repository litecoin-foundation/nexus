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
}

const HeaderButton: React.FC<Props> = props => {
  const {onPress, imageSource, title, rightPadding} = props;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      borderRadius: screenHeight * 0.01,
      backgroundColor: 'rgba(216,216,216,0.2)',
      width: screenHeight * 0.035,
      height: screenHeight * 0.035,
      minWidth: 25,
      minHeight: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: screenHeight * 0.02,
    },
    subcontainer: {
      paddingHorizontal: screenHeight * 0.01,
      paddingVertical: screenHeight * 0.005,
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
      fontSize: screenHeight * 0.012,
    },
    padRight: {
      marginRight: screenHeight * 0.02,
    },
  });

export default HeaderButton;
