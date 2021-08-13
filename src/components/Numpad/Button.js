import React from 'react';
import PropTypes from 'prop-types';
import {TouchableWithoutFeedback, Text, StyleSheet, View} from 'react-native';
import {useSpring, animated, config} from '@react-spring/native';

import {triggerSelectionFeedback} from '../../lib/utils/haptic';

const Button = (props) => {
  const {value, onPress, disabled} = props;
  const AnimatedView = animated(View);

  const [scaler, set] = useSpring(() => ({
    from: {scale: 1},
    config: config.wobbly,
  }));

  const motionStyle = {
    transform: [{scale: scaler.scale}],
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPressIn={() => set({scale: 0.85})}
        onPressOut={() => set({scale: 1})}
        disabled={disabled}
        onPress={() => {
          triggerSelectionFeedback();
          onPress();
        }}>
        <AnimatedView
          style={[
            styles.button,
            disabled ? styles.disabled : null,
            motionStyle,
          ]}>
          <Text style={styles.text}>{value}</Text>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C72FF',
  },
  disabled: {
    opacity: 0,
  },
});

Button.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default Button;
