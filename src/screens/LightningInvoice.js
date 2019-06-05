import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';

import { clearInvoice } from '../reducers/invoice';

export class LightningInvoice extends Component {
  componentWillUnmount() {
    const { clearInvoice } = this.props;
    clearInvoice();
  }

  async handleCopy() {
    const { invoice } = this.props;
    alert('copied');
    await Clipboard.setString(invoice);
  }

  render() {
    const { invoice } = this.props;
    const { description, value } = this.props;
    return (
      <View>
        {!invoice ? (
          <Text>loading...</Text>
        ) : (
          <QRCode value={invoice} color="rgba(10, 36, 79, 1)" size={350} />
        )}
        <Text>Please pay:</Text>
        <Text>{value}</Text>
        <Text>{description}</Text>
        <TouchableOpacity onPress={() => this.handleCopy()}>
          <Text>{invoice}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  invoice: state.invoice.paymentRequest,
  description: state.invoice.description,
  value: state.invoice.value
});

const mapDispatchToProps = { clearInvoice };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightningInvoice);
