import React, { Component, createRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { addPincode, removePincode } from '../../reducers/onboarding';
import { initWallet } from '../../reducers/lightning';

export class Pin extends Component {
  constructor(props) {
    super(props);
    this.handleInput = this.handleInput.bind(this);
    this.pinInput = createRef();
  }

  componentWillUnmount() {
    const { removePincode } = this.props;
    removePincode();
  }

  handleInput = async input => {
    const { addPincode } = this.props;
    if (input.length === 6) {
      await addPincode(input);
      this.pinInput.current.clear();
    }
  };

  handleVerifiction = async input => {
    const { passcode, navigation, beingRecovered, initWallet } = this.props;
    if (input.length !== 6) return;
    this.pinInput.current.clear();
    if (input === passcode && beingRecovered) {
      await initWallet();
      navigation.navigate('App');
    } else if (input === passcode && !beingRecovered) {
      navigation.push('Generate');
    } else {
      navigation.goBack();
      alert('incorrect');
      // TODO deal with this
    }
  };

  render() {
    const { passcodeSet } = this.props;
    return (
      <View>
        <Text style={styles.title}>
          {passcodeSet ? `Verify your Passcode` : `Create a Passcode`}
        </Text>
        <Text style={styles.instructions}>
          {passcodeSet ? `Enter your passcode again.` : `Please enter a secure passcode`}
        </Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          keyboardType="numeric"
          autoFocus
          maxLength={6}
          onChangeText={passcodeSet ? this.handleVerifiction : this.handleInput}
          ref={this.pinInput}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontSize: 20,
    margin: 20
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    backgroundColor: 'green',
    height: 90,
    borderWidth: 1
  }
});

const mapStateToProps = state => ({
  passcodeSet: state.onboarding.passcodeSet,
  passcode: state.onboarding.passcode,
  beingRecovered: state.onboarding.beingRecovered
});

const mapDispatchToProps = {
  addPincode,
  removePincode,
  initWallet
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Pin);
