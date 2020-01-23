import React from 'react';
import {View, StyleSheet} from 'react-native';

import Button from './Button';

const Pad = props => {
  const {currentValue, onChange, children} = props;

  const handlePress = input => {
    let response;
    switch (input) {
      case '.':
        response = currentValue;
        if (currentValue.indexOf('.') === -1) {
          response = `${currentValue}.`;
        }
        if (currentValue === '0.00' || currentValue === '0') {
          response = '0.';
        }
        break;
      case '⌫':
        response = currentValue.length === 1 ? '0' : currentValue.slice(0, -1);
        break;
      default:
        response =
          currentValue === '0.00' || currentValue === '0'
            ? input
            : currentValue + input;
    }
    onChange(response);
  };

  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  const buttons = values.map(value => {
    return (
      <Button key={value} value={value} onPress={() => handlePress(value)} />
    );
  });
  return (
    <View style={styles.container}>
      <View style={styles.area}>{buttons}</View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFD',
    justifyContent: 'space-evenly',
  },
  area: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    alignSelf: 'center',
  },
});

export default Pad;
