import React, { Component } from 'react';
import { View, Text, TextInput, Clipboard, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { decodePaymentRequest } from '../reducers/payment';

export class LightningSend extends Component {
  // eslint-disable-next-line class-methods-use-this
  async handleClipboard() {
    const content = await Clipboard.getString();
    const res = await decodePaymentRequest(content);
    console.log(res);
  }

  render() {
    return (
      <View>
        <TextInput
          placeholder="Invoice"
          selectTextOnFocus
          onChangeText={text => console.log(text)}
        />
        <TouchableOpacity onPress={() => this.handleClipboard()}>
          <Text>Clipboard</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>Scan QR code</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightningSend);
