import React from 'react';
import {View, StyleSheet} from 'react-native';

import BuyButton from './BuyButton';

interface Props {}

const BuyPad: React.FC<Props> = props => {
  const {currentValue, onChange, dotDisabled} = props;

  const handlePress = input => {
    let response;
    switch (input) {
      case '.':
        response = currentValue;
        if (currentValue.indexOf('.') === -1) {
          response = `${currentValue}.`;
        }
        if (currentValue === '' || currentValue === '0') {
          response = '0.';
        }
        break;
      case '⌫':
        response =
          currentValue.length === 1 && (dotDisabled === false || !dotDisabled)
            ? '0'
            : currentValue.length === 1 && dotDisabled === true
            ? ''
            : currentValue.length === 0 &&
              currentValue === '' &&
              (dotDisabled === false || !dotDisabled)
            ? '0'
            : currentValue.slice(0, -1);
        break;
      default:
        response =
          (dotDisabled === false || !dotDisabled) &&
          (currentValue === '' || currentValue === '0')
            ? input
            : currentValue + input;
    }
    onChange(response);
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  const buttons = values.map(value => {
    if (value === '.') {
      return (
        <BuyButton
          key="dot-button-key"
          value={value}
          disabled={dotDisabled}
          onPress={() => handlePress(value)}
        />
      );
    }
    return (
      <BuyButton key={value} value={value} onPress={() => handlePress(value)} />
    );
  });
  return <View style={styles.container}>{buttons}</View>;
};

const styles = StyleSheet.create({
  container: {
    height: 329,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 20,
  },
});

export default BuyPad;
