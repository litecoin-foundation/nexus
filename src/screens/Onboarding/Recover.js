import React, { Component } from 'react';
import { View, Text, TextInput } from 'react-native';
import { connect } from 'react-redux';

import Form from '../../components/Onboarding/Form';
import { recoverSeed } from '../../reducers/onboarding';

export class Recover extends Component {
  handleSubmit = async input => {
    const { recoverSeed, navigation } = this.props;

    const state = Object.values(input);
    await recoverSeed(state);
    await navigation.navigate('Pin');
  };

  render() {
    const n = [...Array(24).keys()];
    const Inputs = n.map(val => {
      return (
        <TextInput
          placeholder="dummy"
          autoCorrect={false}
          autoCapitalize="none"
          clearTextOnFocus
          keyboardAppearance="dark"
          key={val}
        />
      );
    });
    return (
      <View>
        <Text>Login</Text>
        <Text>Enter your paper-key words below.</Text>
        <Form formSubmission={this.handleSubmit}>{Inputs}</Form>
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = { recoverSeed };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Recover);
