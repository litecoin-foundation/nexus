import React, { Component } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import FeeModal from '../components/FeeModal';
import SquareButton from '../components/SquareButton';
import { sendOnchainPayment } from '../reducers/payment';

export class Send extends Component {
  constructor(props) {
    super(props);
    this.state = { modalTriggered: false };
  }

  setModalVisible(bool) {
    this.setState({ modalTriggered: bool });
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
    const { modalTriggered } = this.state;
    return (
      <View>
        <Text>Choose Amount</Text>
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
        <Text>Choose Recipient</Text>
        <View style={styles.recipientContainer}>
          <SquareButton label="Paste" />
          <SquareButton label="NFC" />
          <SquareButton label="Scan" />
        </View>

        <Text>Fee:</Text>
        <TouchableOpacity onPress={() => this.setModalVisible(true)}>
          <Text>meow fee</Text>
        </TouchableOpacity>
        <Button title="Send" onPress={this.handleSubmit} />

        <FeeModal isVisible={modalTriggered} close={() => this.setModalVisible(false)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  recipientContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
    marginTop: 10,
    paddingBottom: 150
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = { sendOnchainPayment };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Send);
