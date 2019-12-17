import React, {Component} from 'react';
import {View, TextInput, TouchableOpacity, Text} from 'react-native';
import {connect} from 'react-redux';

import BlueButton from '../../components/Buttons/BlueButton';
import {connectToPeer} from '../../reducers/channels';

export class OpenChannel extends Component {
  state = {};

  handlePress = async () => {
    const {pubkey} = this.state;
    const {connectToPeer} = this.props;

    await connectToPeer(pubkey);
  };

  render() {
    return (
      <View>
        <Text>ENTER PUBKEY</Text>
        <TextInput
          placeholder="host"
          onChangeText={input => this.setState({pubkey: input})}
        />
        <Text>OR</Text>
        <TouchableOpacity>
          <Text>Paste</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>Scan</Text>
        </TouchableOpacity>
        <BlueButton value="Open Channel" onPress={() => this.handlePress()} />
      </View>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  connectToPeer,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OpenChannel);
