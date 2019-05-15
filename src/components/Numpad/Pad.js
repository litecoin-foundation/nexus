import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Button from './Button';

export class Pad extends Component {
  handlePress = input => {
    const { currentValue, onChange } = this.props;
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
        response = currentValue === '0.00' || currentValue === '0' ? input : currentValue + input;
    }
    onChange(response);
  };

  render() {
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
    const buttons = values.map(value => {
      return <Button key={value} value={value} onPress={() => this.handlePress(value)} />;
    });
    return (
      <View style={styles.container}>
        <View style={{ height: 400, justifyContent: 'space-evenly' }}>
          <View style={styles.area}>{buttons}</View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FBFD'
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    alignSelf: 'center'
  }
});

Pad.propTypes = {
  currentValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Pad;
