import React, {useContext} from 'react';
import {View, Text, StyleSheet, Image, ImageSourcePropType} from 'react-native';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  titleText?: string;
  descriptionText: string;
  imageSource: ImageSourcePropType;
  largeImg?: boolean;
}

const Card: React.FC<Props> = props => {
  const {titleText, descriptionText, imageSource, largeImg} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.internalCardContainer}>
        {titleText ? <Text style={styles.titleText}>{titleText}</Text> : null}

        <Text style={styles.descriptionText}>{descriptionText}</Text>
      </View>
      <View
        style={largeImg ? styles.largeImageContainer : styles.imageContainer}>
        <Image
          resizeMode="contain"
          source={imageSource}
          style={largeImg ? styles.largeImage : styles.image}
        />
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    cardContainer: {
      height: screenHeight * 0.5,
      width: screenWidth - 60,
      borderRadius: screenHeight * 0.02,
      backgroundColor: 'white',
      shadowColor: 'rgb(82,84,103);',
      shadowOpacity: 0.12,
      shadowRadius: screenHeight * 0.015,
      elevation: screenHeight * 0.015,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      textAlign: 'center',
    },
    internalCardContainer: {
      paddingLeft: screenHeight * 0.025,
      paddingRight: screenHeight * 0.025,
      paddingTop: screenHeight * 0.025,
    },
    titleText: {
      textAlign: 'center',
      color: '#2C72FF',
      fontSize: screenHeight * 0.03,
      fontWeight: 'bold',
      paddingBottom: screenHeight * 0.025,
    },
    descriptionText: {
      textAlign: 'center',
      color: '#4A4A4A',
      fontSize: screenHeight * 0.017,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
    },
    imageContainer: {
      flex: 1,
      width: screenWidth * 0.3,
      alignSelf: 'center',
    },
    largeImageContainer: {
      flex: 1,
      height: screenHeight * 0.2,
      width: screenHeight * 0.2,
      alignSelf: 'center',
    },
    image: {
      flex: 1,
      width: screenWidth * 0.3,
      tintColor: '#2C72FF',
    },
    largeImage: {
      flex: 1,
      width: screenHeight * 0.2,
    },
    flex: {
      flex: 1,
    },
  });

export default Card;
