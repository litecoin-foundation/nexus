import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const Button2 = props => {
  const { value, onPress } = props;
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '33%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
    borderRadius: 90 / 2,
    borderColor: 'white',
    borderWidth: 2
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white'
  }
});

Button2.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

export default Button2;
