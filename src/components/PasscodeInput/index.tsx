import React from 'react';
import {StyleSheet, View} from 'react-native';

import Box from './Box';

interface Props {
  dotsLength: number;
  activeDotIndex: number;
}

type ButtonStateType = 'active' | 'inactive' | 'used';

const PasscodeInput: React.FC<Props> = props => {
  const {dotsLength, activeDotIndex} = props;
  const dotsArray = [...Array(dotsLength)];

  const boxes = dotsArray.map((_, index) => {
    let buttonStateValue: ButtonStateType = 'inactive';
    if (activeDotIndex < index) {
      buttonStateValue = 'inactive';
    } else if (activeDotIndex === index) {
      buttonStateValue = 'active';
    } else if (activeDotIndex > index) {
      buttonStateValue = 'used';
    }

    return <Box buttonState={buttonStateValue} />;
  });

  return <View style={styles.container}>{boxes}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
});

export default PasscodeInput;
