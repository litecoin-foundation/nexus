import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AlertIcon = () => {
  return (
    <LinearGradient colors={['#FF415E', '#FF9052']} style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={require('../assets/images/alerts-icon.png')}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 44 / 2,
    marginLeft: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 23,
    width: 23,
  },
  image: {
    flex: 1,
    height: undefined,
    width: undefined,
  },
});

export default AlertIcon;
