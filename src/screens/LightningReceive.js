import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import BlueButton from '../components/BlueButton';
import AmountInput from '../components/AmountInput';
import GreyTextInput from '../components/GreyTextInput';
import { addInvoice } from '../reducers/invoice';

export class LightningReceive extends Component {
  state = {
    memo: '',
    amount: '',
    selected: false
  };

  handlePress = bool => {
    this.setState({ selected: bool });
  };

  handleSubmit = async () => {
    const { amount, memo } = this.state;
    const { addInvoice, navigation } = this.props;

    const invoice = await addInvoice({ amount, memo });
    if (invoice === true) {
      navigation.navigate('LightningInvoice');
    }
  };

  render() {
    const { selected } = this.state;

    return (
      <View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>CHOOSE AMOUNT</Text>
        </View>
        <AmountInput
          onChangeText={input => this.setState({ amount: input })}
          onAccept={() => this.handlePress(false)}
          selected={() => this.handlePress(true)}
        />

        {!selected ? (
          <View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.leftTitle}>ADD Description</Text>
              <GreyTextInput
                placeholder="placeholder"
                onChangeText={input => this.setState({ memo: input })}
              />
            </View>

            <BlueButton value="Create Invoice" onPress={this.handleSubmit} />
          </View>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  descriptionContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 30
  },
  titleContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  },
  leftTitle: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  },
  title: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600'
  }
});

const mapStateToProps = state => ({});

const mapDispatchToProps = { addInvoice };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightningReceive);
