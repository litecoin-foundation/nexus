import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Button2 from './Button2';

export class Pad extends Component {
  handlePress = input => {
    const { currentValue, onChange } = this.props;
    let response;
    switch (input) {
      case '.':
        // TODO: biometric login flow
        break;
      case '⌫':
        response = currentValue.slice(0, -1);
        break;
      default:
        response = currentValue + input;
        break;
    }
    onChange(response);
  };

  render() {
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

    const buttons = values.map(value => {
      return <Button2 key={value} value={value} onPress={() => this.handlePress(value)} />;
    });

    return (
      <View>
        <View style={styles.buttonContainer}>
          <View style={styles.area}>{buttons}</View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    height: 450,
    backgroundColor: 'transparent',
    justifyContent: 'space-evenly',
    flexGrow: 1
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '90%',
    alignSelf: 'center'
  }
});

Pad.propTypes = {
  currentValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Pad;
