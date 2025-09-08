import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  percentageProgress: number;
  white?: boolean;
  color?: string;
  height?: number;
  rounded?: boolean;
}

const ProgressBar = (props: Props) => {
  const {percentageProgress, white, color, height, rounded} = props;
  // Floor it to 1 decimal, min 0.1%
  const filteredProgress =
    percentageProgress > 0
      ? percentageProgress > 100
        ? 100
        : Math.floor(percentageProgress * 10) / 10
      : 0.1;

  const colorStyle = color ? {backgroundColor: color} : null;
  const heightStyle = height ? {height: height} : null;
  const radius = height ? height / 2 : 2;
  const roundedStyle = rounded
    ? {
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
      }
    : null;

  return (
    <View
      style={[
        white ? styles.whiteBar : styles.container,
        {width: `${filteredProgress}%`},
        colorStyle,
        heightStyle,
        roundedStyle,
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
