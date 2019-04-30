import React, { Component } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { connect } from 'react-redux';

import { sendOnchainPayment } from '../reducers/payment';

export class Send extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleInput = (type, input) => {
    this.setState({
      [type]: input
    });
  };

  handleSubmit = async () => {
    const { sendOnchainPayment } = this.props;
    const { amount, addr } = this.state;
    const paymentreq = { amount, addr };
    await sendOnchainPayment(paymentreq);
  };

  render() {
    return (
      <View>
        <Text>Amount</Text>
        <TextInput
          placeholder="0 LTC"
          keyboardType="numeric"
          onChangeText={input => this.handleInput('amount', input)}
        />
        <Text>Address</Text>
        <TextInput
          placeholder="enter address here"
          onChangeText={input => this.handleInput('addr', input)}
        />
        <Text>Fee:</Text>
        <Button title="Send" onPress={this.handleSubmit} />
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = { sendOnchainPayment };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Send);
