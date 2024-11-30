import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  ImageSourcePropType,
} from 'react-native';

interface Props {
  titleText?: string;
  descriptionText: string;
  imageSource: ImageSourcePropType;
  largeImg?: boolean;
}

const Card: React.FC<Props> = props => {
  const {titleText, descriptionText, imageSource, largeImg} = props;
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

const styles = StyleSheet.create({
  cardContainer: {
    height: 450,
    width: 335,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    textAlign: 'center',
  },
  internalCardContainer: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
  },
  titleText: {
    textAlign: 'center',
    color: '#2C72FF',
    fontSize: 27,
    fontWeight: 'bold',
    paddingBottom: 25,
  },
  descriptionText: {
    textAlign: 'center',
    color: '#4A4A4A',
    fontSize: 15,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
  },
  imageContainer: {
    flex: 1,
    width: 128,
    alignSelf: 'center',
    backgroundColor: 'red',
  },
  largeImageContainer: {
    flex: 1,
    height: 200,
    width: 200,
    alignSelf: 'center',
  },
  image: {
    flex: 1,
    width: 128,
    tintColor: '#2C72FF',
  },
  largeImage: {
    flex: 1,
    width: 200,
  },
  flex: {
    flex: 1,
  },
});

export default Card;
