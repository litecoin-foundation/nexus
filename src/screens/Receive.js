import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';

import { getAddress } from '../reducers/address';

export class Receive extends Component {
  async componentDidMount() {
    const { getAddress } = this.props;
    await getAddress();
  }

  render() {
    const { address } = this.props;
    return (
      <View>
        <QRCode value={address} />
        <Text>{address}</Text>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  address: state.address.address
});

const mapDispatchToProps = { getAddress };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Receive);
