import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const GreyRoundButton = props => {
  const {onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={require('../../assets/images/close.png')} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 29,
    width: 39,
    borderRadius: 14.5,
    backgroundColor: '#D4D3DA',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      height: 0,
      width: 0,
    },

    alignItems: 'center',
    justifyContent: 'center',
  },
});

GreyRoundButton.propTypes = {
  onPress: PropTypes.func.isRequired,
};

export default GreyRoundButton;
