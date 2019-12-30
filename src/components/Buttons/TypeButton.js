import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import PropTypes from 'prop-types';

const TypeButton = props => {
  const {label, onPress, imageSource} = props;
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.contentContainer}>
        <Image style={styles.image} source={imageSource} />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 157,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: 'rgba(82,84,103,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {
      height: 6,
      width: 0,
    },
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.32,
    textAlign: 'center',
  },
  image: {
    height: 22,
    width: 22,
    position: 'absolute',
    left: 14,
  },
});

TypeButton.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default TypeButton;
