import React, { Component } from 'react';
import { View, Text, TextInput } from 'react-native';
import { connect } from 'react-redux';

import BlueButton from '../components/BlueButton';
import AmountInput from '../components/AmountInput';
import { addInvoice } from '../reducers/invoice';

export class LightningReceive extends Component {
  state = {
    memo: '',
    amount: ''
  };

  handlePress = async () => {
    const { amount, memo } = this.state;
    const { addInvoice, navigation } = this.props;

    const invoice = await addInvoice({ amount, memo });
    if (invoice === true) {
      navigation.navigate('LightningInvoice');
    }
  };

  render() {
    return (
      <View>
        <Text> Choose Amount </Text>
        <AmountInput
          onChangeText={input => this.setState({ amount: input })}
          onAccept={() => console.log('meow')}
        />
        <Text>Add Description</Text>
        <TextInput
          placeholder="description goes here"
          onChangeText={input => this.setState({ memo: input })}
        />
        <BlueButton value="Create Invoice" onPress={this.handlePress} />
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = { addInvoice };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightningReceive);
