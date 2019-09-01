import React, {Component} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Clipboard,
  StyleSheet,
} from 'react-native';
import {connect} from 'react-redux';
import QRCode from 'react-native-qrcode-svg';

import {clearInvoice} from '../reducers/invoice';

export class LightningInvoice extends Component {
  componentWillUnmount() {
    const {clearInvoice} = this.props;
    clearInvoice();
  }

  async handleCopy() {
    const {invoice} = this.props;
    alert('copied');
    await Clipboard.setString(invoice);
  }

  render() {
    const {invoice} = this.props;
    const {description, value} = this.props;
    return (
      <View style={styles.container}>
        {!invoice ? (
          <Text>loading...</Text>
        ) : (
          <View style={styles.qrContainer}>
            <QRCode value={invoice} color="rgba(10, 36, 79, 1)" size={350} />
          </View>
        )}
        <View style={styles.detailContainer}>
          <Text style={styles.paymentText}>Please pay: {value}</Text>
          <Text style={styles.paymentText}>{description}</Text>
          <TouchableOpacity onPress={() => this.handleCopy()}>
            <Text>{invoice}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  qrContainer: {
    paddingTop: 15,
    paddingBottom: 15,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F6F9FC',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(151, 151, 151, 0.3)',
  },
  paymentText: {
    textAlign: 'center',
    color: 'rgba(10, 36, 79, 1)',
  },
});

const mapStateToProps = state => ({
  invoice: state.invoice.paymentRequest,
  description: state.invoice.description,
  value: state.invoice.value,
});

const mapDispatchToProps = {clearInvoice};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LightningInvoice);
