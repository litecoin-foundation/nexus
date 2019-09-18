import React, {Component} from 'react';
import {View, Text} from 'react-native';
import {connect} from 'react-redux';

import {startOnboarding} from '../reducers/onboarding';
import {startLnd} from '../reducers/lightning';
import {checkBiometricSupport} from '../lib/utils/biometric';

export class Loading extends Component {
  componentDidMount() {
    const {
      navigation,
      onboarding,
      isOnboarded,
      startOnboarding,
      startLnd,
      checkBiometricSupport,
    } = this.props;

    // start LND process
    startLnd();
    checkBiometricSupport();

    if (onboarding === false && isOnboarded === true) {
      navigation.navigate('Auth');
    } else {
      startOnboarding();
      navigation.navigate('Onboarding');
    }
  }

  render() {
    return (
      <View>
        <Text> Loading... </Text>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  onboarding: state.onboarding.onboarding,
  isOnboarded: state.onboarding.isOnboarded,
});

const mapDispatchToProps = {startOnboarding, startLnd, checkBiometricSupport};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Loading);
