import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  progress: number;
  white?: boolean;
}

const ProgressBar = (props: Props) => {
  const {progress, white} = props;
  return (
    <View
      style={[
        white ? styles.whiteBar : styles.container,
        {width: `${progress}%`},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    height: 3,
    backgroundColor: '#1162E6',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
  whiteBar: {
    height: 4,
    backgroundColor: '#fff',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default ProgressBar;
