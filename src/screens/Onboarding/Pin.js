import React, { Component, createRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { addPincode, removePincode } from '../../reducers/onboarding';

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

  handleInput = input => {
    const { addPincode } = this.props;
    if (input.length === 6) {
      addPincode(input);
      this.pinInput.current.clear();
    }
  };

  handleVerifiction = input => {
    const { passcode, navigation } = this.props;
    if (input.length === 6) {
      this.pinInput.current.clear();
      if (input === passcode) {
        navigation.push('generateWallet');
      } else {
        navigation.goBack();
        alert('incorrect');
        // TODO deal with this
      }
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
  passcode: state.onboarding.passcode
});

const mapDispatchToProps = {
  addPincode,
  removePincode
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Pin);
