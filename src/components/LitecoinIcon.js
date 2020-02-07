import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LitecoinIcon = props => {
  const {size} = props;
  return (
    <LinearGradient
      colors={['#6954F2', 'rgb(0, 61, 179)']}
      style={[
        styles.container,
        size ? {width: size, height: size, borderRadius: size / 2} : null,
      ]}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={require('../assets/images/ltc-logo.png')}
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
    height: 15,
    width: 15,
  },
  image: {
    flex: 1,
    height: undefined,
    width: undefined,
  },
});

export default LitecoinIcon;
