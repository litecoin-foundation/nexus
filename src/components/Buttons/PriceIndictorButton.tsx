import React from 'react';
import {View, StyleSheet} from 'react-native';

interface Props {
  value: number;
}

const PriceIndicatorButton: React.FC<Props> = props => {
  const {value} = props;
  const isPriceNegative = Math.sign(value) === -1;
  return (
    <View
      style={[styles.container, isPriceNegative ? null : styles.negative]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#20BB74',
    height: 17,
    width: 17,
    borderRadius: 17 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(82,84,103);',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  negative: {
    backgroundColor: '#f25246',
  },
});

export default PriceIndicatorButton;
