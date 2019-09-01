import React from 'react';
import {View, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const VerticalProgressBar = props => {
  const {capacity, type} = props;
  const {balance} = props;

  let progress = 0;

  if (balance !== undefined && balance !== 0) {
    progress = parseFloat((capacity / balance) * 100);
  }

  return (
    <View style={styles.container}>
      <View style={progressBarStyle(progress, type)} />
    </View>
  );
};

const progressBarStyle = (progress, type) => {
  return {
    width: '100%',
    backgroundColor: '#20BB74',
    height: `${progress}%`,
    borderRadius: 1.5,
    marginTop: type === 'remote' ? 65 - (progress * 65) / 100 : 0,
  };
};

const styles = StyleSheet.create({
  container: {
    height: 65,
    width: 11,
    borderRadius: 2,
    backgroundColor: '#E9E9E9',
    marginRight: 20,
  },
});

VerticalProgressBar.propTypes = {
  capacity: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  balance: PropTypes.number.isRequired,
};

export default VerticalProgressBar;
