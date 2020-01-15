import React from 'react';
import {Image, StyleSheet} from 'react-native';
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
      <Image
        style={styles.image}
        source={require('../assets/images/ltc-logo.png')}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    marginLeft: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 15,
    width: 15,
  },
});

export default LitecoinIcon;
