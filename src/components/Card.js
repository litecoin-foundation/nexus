import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

const Card = props => {
  const {titleText, descriptionText, imageSource} = props;
  return (
    <View style={styles.cardContainer}>
      <View style={styles.internalCardContainer}>
        <Text style={styles.titleText}>{titleText}</Text>
        <Text style={styles.descriptionText}>{descriptionText}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.imageContainer}>
          <Image
            resizeMode="contain"
            source={imageSource}
            style={styles.image}
          />
        </View>
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
    flex: 1,
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
  },
  imageContainer: {
    height: 128,
    width: 128,
    alignSelf: 'center',
  },
  image: {
    flex: 1,
    width: 128,
  },
  flex: {
    flex: 1,
  },
});

export default Card;
