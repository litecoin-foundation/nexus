import React, {useContext} from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  active: boolean;
  title: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
}

const FilterButton: React.FC<Props> = props => {
  const {active, title, onPress, imageSource} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Pressable
      style={[styles.button, active ? styles.activeButton : null]}
      onPress={onPress}>
        <Image style={styles.image} source={imageSource} />
        <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    button: {
      height: screenHeight * 0.065,
      width: screenHeight * 0.06,
      borderRadius: screenHeight * 0.01,
      backgroundColor: undefined,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: screenHeight * 0.01,
    },
    activeButton: {
      backgroundColor: '#0A429B',
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#fff',
      fontSize: screenHeight * 0.012,
    },
    image: {
      height: screenHeight * 0.025,
      width: screenHeight * 0.025,
      objectFit: 'scale-down',
      tintColor: '#fff',
    },
  });

export default FilterButton;
