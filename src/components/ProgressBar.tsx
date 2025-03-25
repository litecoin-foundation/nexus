import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  progress: number;
  white?: boolean;
}

const ProgressBar = (props: Props) => {
  const {progress, white} = props;
  const legitProgress = progress > 0 ? (progress > 100 ? 100 : progress) : 1;
  return (
    <View
      style={[
        white ? styles.whiteBar : styles.container,
        {width: `${legitProgress}%`},
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
