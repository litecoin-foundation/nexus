import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

export class Settings extends Component {
  render() {
    const { navigation } = this.props;
    return (
      <View>
        <TouchableOpacity onPress={() => navigation.navigate('Channel')}>
          <Text>Channels</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
