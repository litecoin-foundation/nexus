import React from 'react';
import PropTypes from 'prop-types';
import {TouchableOpacity, Image, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

const Button = props => {
  const {onPress} = props;
  const biometricsEnabled = useSelector(
    state => state.authentication.biometricsEnabled,
  );
  const biometricType = useSelector(
    state => state.authentication.faceIDSupported,
  );

  return (
    <View
      style={[styles.container, !biometricsEnabled ? styles.disabled : null]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        disabled={!biometricsEnabled}>
        <Image
          source={
            biometricType === true
              ? require('../../assets/images/face-id-blue.png')
              : require('../../assets/images/touch-id-blue.png')
          }
          style={styles.image}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '33%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 72,
    borderRadius: 72 / 2,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  image: {
    height: 30,
    width: 30,
  },
  disabled: {
    opacity: 0,
  },
});

Button.propTypes = {
  onPress: PropTypes.func.isRequired,
};

export default Button;
