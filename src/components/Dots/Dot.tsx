import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

interface Props {
  active: boolean;
}

const Dot: React.FC<Props> = props => {
  const {active} = props;

  return (
    <TouchableOpacity
      accessible={false}
      style={styles.dotContainerStyle}
      activeOpacity={1}>
      <View style={[styles.dotStyle, !active ? styles.inactive : null]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dotContainerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  dotStyle: {
    width: 15,
    height: 15,
    borderRadius: 15 / 2,
    backgroundColor: '#f7f7f7',
  },
  inactive: {
    opacity: 0.5,
  },
});

export default Dot;
