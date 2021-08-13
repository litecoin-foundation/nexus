import React from 'react';
import PropTypes from 'prop-types';
import {TouchableWithoutFeedback, Image, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useSpring, animated, config} from '@react-spring/native';

const Button = (props) => {
  const {onPress} = props;
  const AnimatedView = animated(View);
  const biometricsEnabled = useSelector(
    (state) => state.authentication.biometricsEnabled,
  );
  const biometricType = useSelector(
    (state) => state.authentication.faceIDSupported,
  );

  const [scaler, set] = useSpring(() => ({
    from: {scale: 1},
    config: config.wobbly,
  }));

  const motionStyle = {
    transform: [{scale: scaler.scale}],
  };

  return (
    <View
      style={[styles.container, !biometricsEnabled ? styles.disabled : null]}>
      <TouchableWithoutFeedback
        onPressIn={() => set({scale: 0.85})}
        onPressOut={() => set({scale: 1})}
        onPress={onPress}
        disabled={!biometricsEnabled}>
        <AnimatedView style={[styles.button, motionStyle]}>
          <Image
            source={
              biometricType === true
                ? require('../../assets/images/face-id-blue.png')
                : require('../../assets/images/touch-id-blue.png')
            }
            style={styles.image}
          />
        </AnimatedView>
      </TouchableWithoutFeedback>
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
