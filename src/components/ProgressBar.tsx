import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  progress: number;
}

const ProgressBar = (props: Props) => {
  const {progress} = props;
  return <View style={[styles.container, {width: `${progress}%`}]} />;
};

const styles = StyleSheet.create({
  container: {
    height: 3,
    backgroundColor: '#1162E6',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
});

export default ProgressBar;
