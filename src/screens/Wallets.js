import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';

export class Wallets extends Component {
  render() {
    return (
      <View>
        <Text> App! </Text>
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Wallets);
