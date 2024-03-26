import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

interface Props {
  active: boolean;
  dashLines?: boolean;
}

const Dot: React.FC<Props> = props => {
  const {active, dashLines} = props;

  return (
    <TouchableOpacity
      accessible={false}
      style={styles.dotContainerStyle}
      activeOpacity={1}>
      <View style={[styles.dotStyle, !active ? styles.inactive : null]} />
      {dashLines ? (
        <View style={[styles.dashStyle, !active ? styles.inactive : null]} />
      ) : null}
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
    backgroundColor: 'white',
  },
  dashStyle: {
    borderRadius: 1.5,
    backgroundColor: 'white',
    height: 3,
    width: 30,
    marginTop: 12,
  },
  inactive: {
    opacity: 0.5,
  },
});

export default Dot;
