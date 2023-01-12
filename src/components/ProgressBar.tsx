import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  progress: number;
}

const ProgressBar = (props: Props) => {
  const {progress} = props;
  return (
    <View style={styles.container}>
      <View style={progressBarStyle(progress)} />
    </View>
  );
};

const progressBarStyle = (progress: number) => {
  return {
    width: `${progress ? progress : 0}%`,
    backgroundColor: '#20BB74',
    height: 8,
    borderRadius: 1.5,
    marginLeft: 3,
    marginTop: 3,
  };
};

const styles = StyleSheet.create({
  container: {
    height: 14,
    width: 335,
    borderRadius: 4,
    backgroundColor: '#113066',
  },
});

export default ProgressBar;
