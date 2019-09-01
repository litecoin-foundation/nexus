import React, {Component} from 'react';
import {View, Text, TextInput, Clipboard, TouchableOpacity} from 'react-native';
import {connect} from 'react-redux';

import {decodePaymentRequest, sendLightningPayment} from '../reducers/payment';

export class LightningSend extends Component {
  state = {
    invoice: '',
  };

  handleInput = input => {
    console.log(input);
    this.setState({invoice: input}, () => console.log('updated state'));
    this.setState((state, props) => {
      console.log(state);
    });
  };

  async handleClipboard() {
    const content = await Clipboard.getString();
    const res = await decodePaymentRequest(content);
    console.log(res);
  }

  async handleSend() {
    const {invoice} = this.state;
    const {sendLightningPayment} = this.props;

    console.log(`about to send payment to: ${invoice}`);

    sendLightningPayment(invoice);
  }

  render() {
    return (
      <View>
        <TextInput
          placeholder="Invoice"
          selectTextOnFocus
          onChangeText={input => this.handleInput(input)}
          style={{marginTop: 50}}
        />
        <TouchableOpacity onPress={() => this.handleClipboard()}>
          <Text>Clipboard</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>Scan QR code</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.handleSend()}>
          <Text>Send Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  sendLightningPayment,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LightningSend);
