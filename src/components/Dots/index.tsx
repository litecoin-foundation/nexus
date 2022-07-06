import {StyleSheet, View} from 'react-native';
import React from 'react';
import Dot from './Dot';

interface Props {
  dotsLength: number;
  activeDotIndex: number;
}

const Dots: React.FC<Props> = props => {
  const {dotsLength, activeDotIndex} = props;
  const dotsArray = [...Array(dotsLength)];

  const meow = dotsArray.map((val, index) => {
    return <Dot active={index <= activeDotIndex ? true : false} />;
  });

  return <View style={styles.container}>{meow}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default Dots;
