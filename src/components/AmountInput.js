import React, { Component, Fragment } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Pad from './Numpad/Pad';

export class AmountInput extends Component {
  state = {
    amount: '0.00',
    fiatAmount: '0.00',
    selected: true // if true left, TODO: change name later
  };

  handlePress = side => {
    if (side === 'left') {
      this.setState({ selected: true });
    } else {
      this.setState({ selected: false });
    }
  };

  onChange = value => {
    const { selected } = this.state;
    if (selected === true) {
      this.setState({ amount: value }, () => this.handleConversion());
    } else {
      this.setState({ fiatAmount: value }, () => this.handleConversion());
    }
  };

  handleConversion = () => {
    const { selected, amount, fiatAmount } = this.state;
    const { rates } = this.props;

    if (!selected) {
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

  render() {
    const { amount, fiatAmount, selected } = this.state;
    return (
      <Fragment>
        <View style={styles.container}>
          <View style={styles.area}>
            <TouchableOpacity
              style={[styles.left, selected ? styles.active : styles.inActive]}
              onPress={() => this.handlePress('left')}
            >
              <Text style={styles.leftText}>{amount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.right, !selected ? styles.active : styles.inActive]}
              onPress={() => this.handlePress('right')}
            >
              <Text style={styles.rightText}>{fiatAmount}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Pad onChange={this.onChange} currentValue={selected ? amount : fiatAmount} />
      </Fragment>
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
  area: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  left: {
    borderWidth: 1,
    borderColor: 'green',
    justifyContent: 'center',
    width: '70%'
  },
  leftText: {
    color: '#2C72FF'
  },
  right: {
    borderWidth: 1,
    borderColor: 'pink',
    justifyContent: 'center',
    width: '30%'
  },
  rightText: {
    color: '#20BB74'
  },
  active: {
    width: '70%'
  },
  inActive: {
    width: '30%'
  }
});

AmountInput.propTypes = {
  rates: PropTypes.objectOf(PropTypes.string).isRequired,
  onChangeText: PropTypes.func
};

const mapStateToProps = state => ({
  rates: state.ticker.rates
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmountInput);
