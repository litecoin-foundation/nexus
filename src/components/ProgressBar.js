import React from 'react';
import {View, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const ProgressBar = props => {
  const {progress} = props;
  return (
    <View style={styles.container}>
      <View style={progressBarStyle(progress)} />
    </View>
  );
};

const progressBarStyle = progress => {
  return {
    width: `${progress}%`,
    backgroundColor: '#20BB74',
    height: '100%',
    borderRadius: 1.5,
    shadowColor: '#20BB74',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  };
};

const styles = StyleSheet.create({
  container: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E9E9E9',
    marginTop: 7,
    marginRight: 20,
  },
});

ProgressBar.propTypes = {
  progress: PropTypes.number,
};

export default ProgressBar;
