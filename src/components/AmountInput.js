import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Pad from './Numpad/Pad';
import BlueSquareButton from './Numpad/BlueSquareButton';

export class AmountInput extends Component {
  state = {
    amount: '0.00',
    fiatAmount: '0.00',
    leftToggled: true,
    selected: false
  };

  handlePress = side => {
    const { selected } = this.props;
    if (side === 'left') {
      this.setState({ leftToggled: true, selected: true }, () => selected());
    } else {
      this.setState({ leftToggled: false, selected: true }, () => selected());
    }
  };

  onChange = value => {
    const { leftToggled } = this.state;
    if (leftToggled === true) {
      this.setState({ amount: value }, () => this.handleConversion());
    } else {
      this.setState({ fiatAmount: value }, () => this.handleConversion());
    }
  };

  handleConversion = () => {
    const { leftToggled, amount, fiatAmount } = this.state;
    const { rates } = this.props;

    if (!leftToggled) {
      const convertedAmount = `${(parseFloat(fiatAmount) / rates.USD).toFixed(4)}`;
      this.setState({ amount: convertedAmount }, () => this.afterConversion());
    } else {
      const convertedFiat = `${(parseFloat(amount) * rates.USD).toFixed(2)}`;
      this.setState({ fiatAmount: convertedFiat }, () => this.afterConversion());
    }
  };

  afterConversion = () => {
    const { amount } = this.state;
    const { onChangeText } = this.props;

    onChangeText(amount);
  };

  handleAccept = () => {
    const { onAccept } = this.props;
    this.setState({ selected: false });
    onAccept();
  };

  render() {
    const { amount, fiatAmount, leftToggled, selected } = this.state;
    const { toggleWithoutSelection } = this.props;
    const PadContainer = (
      <View style={styles.padContainer}>
        <Pad onChange={this.onChange} currentValue={leftToggled ? amount : fiatAmount} />
        <BlueSquareButton value="ACCEPT" onPress={this.handleAccept} />
      </View>
    );
    return (
      <View style={[selected ? { height: '100%' } : null]}>
        <View style={styles.container}>
          <View style={styles.area}>
            <TouchableOpacity
              style={[styles.left, leftToggled ? styles.active : styles.inActive]}
              onPress={() => this.handlePress('left')}
            >
              <Text
                style={[styles.leftText, leftToggled ? styles.textActive : styles.textInactive]}
              >
                {amount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.right, !leftToggled ? styles.active : styles.inActive]}
              onPress={() => this.handlePress('right')}
            >
              <Text
                style={[styles.rightText, leftToggled ? styles.textInactive : styles.textActive]}
              >
                {fiatAmount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {toggleWithoutSelection ? PadContainer : null}
        {selected && !toggleWithoutSelection ? PadContainer : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 77,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    shadowColor: 'rgb(82,84,103)',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  padContainer: {
    backgroundColor: '#F8FBFD',
    flexGrow: 1,
    justifyContent: 'space-evenly'
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  left: {
    justifyContent: 'center',
    width: '70%',
    borderRightColor: '#DBDBDB',
    borderRightWidth: 1
  },
  leftText: {
    color: '#2C72FF',
    fontWeight: '600',
    paddingLeft: 20
  },
  right: {
    justifyContent: 'center',
    width: '30%'
  },
  rightText: {
    color: '#20BB74',
    fontWeight: '600',
    paddingLeft: 20
  },
  active: {
    width: '70%'
  },
  inActive: {
    width: '30%'
  },
  textActive: {
    fontSize: 28
  },
  textInactive: {
    fontSize: 18
  }
});

AmountInput.propTypes = {
  rates: PropTypes.objectOf(PropTypes.string).isRequired,
  onChangeText: PropTypes.func,
  onAccept: PropTypes.func.isRequired,
  toggleWithoutSelection: PropTypes.bool,
  selected: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  rates: state.ticker.rates
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmountInput);
