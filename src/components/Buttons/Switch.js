import React, {useState} from 'react';
import {TouchableOpacity, StyleSheet, Text, Animated} from 'react-native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Switch = props => {
  const {onPress} = props;
  const [triggered, trigger] = useState(false);

  const handlePress = () => {
    trigger(!triggered);
    onPress(!triggered);
  };

  return (
    <AnimatedTouchable style={[styles.container]} onPress={() => handlePress()}>
      <Text>{triggered ? 'ON' : 'OFF'}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36,
    width: 63,
    borderRadius: 20,
    backgroundColor: '#D4D3DA',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },

    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 100,
    height: 100,
  },
});

export default Switch;
