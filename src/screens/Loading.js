import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { startOnboarding } from '../reducers/onboarding';

export class Loading extends Component {
  componentWillMount() {
    const { navigation, onboarding, isOnboarded, startOnboarding } = this.props;
    if (onboarding === false && isOnboarded === false) {
      // needs to be onboarded
      // TODO: handle update STATE!
      startOnboarding();
      navigation.navigate('Onboarding');
    } else if (onboarding === false && isOnboarded === true) {
      // access wallet
      navigation.navigate('App');
    } else {
      // probably needs to be onboarded (crash)
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
  isOnboarded: state.onboarding.isOnboarded
});

const mapDispatchToProps = { startOnboarding };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Loading);
