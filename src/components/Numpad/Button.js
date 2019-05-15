import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const Button = props => {
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
    width: 72,
    height: 72,
    borderRadius: 72 / 2,
    borderColor: '#2C72FF',
    borderWidth: 2
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C72FF'
  }
});

Button.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

export default Button;
