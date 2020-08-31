import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';

const WhiteRectButton = (props) => {
  const {onPress, title, imageSource} = props;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.mainContainer}>
        <Image source={imageSource} />
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: 70,
    width: Dimensions.get('window').width - 30,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 15,
    marginRight: 15,
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    shadowOffset: {
      height: 3,
      width: 0,
    },
  },
  text: {
    color: '#484859',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
    paddingLeft: 19,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 17,
  },
});

export default WhiteRectButton;
