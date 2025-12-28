import React from 'react';
import {View, StyleSheet} from 'react-native';

import CharacterBox from './CharacterBox';

interface Props {
  codeInactive: boolean;
  codeLength: number;
  value: string;
}

type ButtonStateType = 'active' | 'inactive' | 'used' | 'disabled';

const CodeInput: React.FC<Props> = props => {
  const {codeInactive, codeLength, value} = props;
  const boxesArray = [...Array(codeLength)];

  const boxes = boxesArray.map((_, index) => {
    let buttonStateValue: ButtonStateType = 'inactive';
    const character = value[index] || '';

    if (codeInactive) {
      buttonStateValue = 'disabled';
    } else {
      if (value.length < index) {
        buttonStateValue = 'inactive';
      } else if (value.length === index) {
        buttonStateValue = 'active';
      } else if (value.length > index) {
        buttonStateValue = 'used';
      }
    }

    return (
      <CharacterBox
        buttonState={buttonStateValue}
        character={character}
        key={index}
      />
    );
  });

  return <View style={styles.container}>{boxes}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
});

export default CodeInput;
