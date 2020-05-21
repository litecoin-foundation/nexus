import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const BlueSquareButton = (props) => {
  const {value, onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    height: 100,
    width: '100%',
    backgroundColor: '#2C72FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: {
    fontSize: 15,
    color: '#FFFFFF',
    paddingBottom: 20,
  },
});

BlueSquareButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default BlueSquareButton;
