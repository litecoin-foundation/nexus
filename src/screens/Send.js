import React, { Component, Fragment } from 'react';
import { View, Text, Clipboard, StyleSheet, TextInput } from 'react-native';
import { connect } from 'react-redux';

import AmountInput from '../components/AmountInput';
import AddressField from '../components/AddressField';
import FeeModal from '../components/FeeModal';
import SendModal from '../components/SendModal';
import SquareButton from '../components/SquareButton';
import BlueFatButton from '../components/BlueFatButton';
import GreenRoundButton from '../components/GreenRoundButton';
import { sendOnchainPayment, inputParams, estimateOnchainFee } from '../reducers/payment';
import * as bip21 from '../lib/utils';
import validate from '../lib/utils/validate';

export class Send extends Component {
  state = {
    isSendModalTriggered: false,
    isFeeModalTriggered: false,
    address: null,
    amount: null,
    fee: 0
  };

  setModalVisible(modal, bool) {
    this.setState({ [modal]: bool });
  }

  handleSubmit = async () => {
    const { sendOnchainPayment } = this.props;
    const { amount, address } = this.state;
    const paymentreq = { amount, addr: address };
    await sendOnchainPayment(paymentreq);
  };

  handlePaste = async () => {
    const address = await Clipboard.getString();
    if (this.validation(address) !== false) {
      // TODO: handle validation failure
      try {
        const decoded = bip21.decodeBIP21(address);
        this.setState(
          {
            address: decoded.address,
            amount: decoded.options.amount
          },
          () => this.updateFees()
        );
      } catch {
        this.setState({ address }, () => this.updateFees());
      }
    }
  };

  handleScan = () => {
    const { navigation } = this.props;
    navigation.navigate('Scanner');
  };

  handleClose = () => {
    this.setState({
      address: ''
    });
  };

  updateFees = () => {
    const { estimateOnchainFee } = this.props;
    const { address, amount } = this.state;
    if (address === undefined || amount === undefined) return;
    estimateOnchainFee(address, amount);
  };

  validation = address => {
    try {
      const decoded = bip21.decodeBIP21(address);
      const bool = validate(decoded.address);
      return bool;
    } catch {
      const bool = validate(address);
      return bool;
    }
  };

  render() {
    const { isSendModalTriggered, isFeeModalTriggered, address, amount, fee } = this.state;
    return (
      <Fragment>
        <View style={styles.amountHeaderContainer}>
          <Text style={styles.amountHeaderText}>CHOOSE AMOUNT</Text>
        </View>

        <AmountInput
          onChangeText={input => this.setState({ amount: input })}
          onAccept={() => console.log('pressed accept')}
          selected={() => console.log('selected')}
        />

        <View style={styles.recipientHeaderContainer}>
          <Text style={styles.recipientHeaderText}>CHOOSE recipient</Text>
          {address ? (
            <AddressField address={address} onPressClose={this.handleClose} />
          ) : (
            <View style={styles.recipientContainer}>
              <SquareButton value="Paste" onPress={() => this.handlePaste()} />
              <SquareButton value="NFC" />
              <SquareButton value="Scan" onPress={this.handleScan} />
            </View>
          )}

          <Text style={styles.descriptionHeaderText}>ADD Description</Text>

          <View style={styles.descriptionContainer}>
            <TextInput placeholder="description" />
          </View>

          <View style={styles.feeContainer}>
            <Text style={styles.feeHeaderText}>FEE</Text>
            <GreenRoundButton
              onPress={() => this.setModalVisible('isFeeModalTriggered', true)}
              value={fee}
              disabled
            />
          </View>
        </View>

        <FeeModal
          isVisible={isFeeModalTriggered}
          close={() => this.setModalVisible('isFeeModalTriggered', false)}
        />
        <SendModal
          isVisible={isSendModalTriggered}
          close={() => this.setModalVisible('isSendModalTriggered', false)}
        />

        <View style={styles.sendContainer}>
          <BlueFatButton
            value="SEND LTC"
            address={address}
            amount={amount}
            fee={fee}
            onPress={() => this.setModalVisible('isSendModalTriggered', true)}
          />
        </View>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  recipientContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
    paddingBottom: 105
  },
  amountHeaderContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  },
  amountHeaderText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  },
  recipientHeaderContainer: {
    marginLeft: 20,
    paddingRight: 20
  },
  recipientHeaderText: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  },
  descriptionHeaderText: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  },
  descriptionContainer: {
    marginLeft: 0,
    paddingLeft: 20,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  feeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40
  },
  feeHeaderText: {
    height: 22,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  },
  sendContainer: {
    height: 100,
    width: '100%',
    bottom: 0,
    position: 'absolute'
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = { sendOnchainPayment, inputParams, estimateOnchainFee };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Send);
