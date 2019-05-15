import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import PropTypes from 'prop-types';

import { getAddress } from '../reducers/address';

export class Receive extends Component {
  async componentDidMount() {
    const { getAddress } = this.props;
    await getAddress();
  }

  handlePress = async () => {
    const { address } = this.props;
    await Clipboard.setString(address);
  };

  render() {
    const { address } = this.props;
    // TODO: refactor qrcode to functional component
    // which only renders after address is available
    return (
      <View style={styles.container}>
        {!address ? (
          <Text>loading...</Text>
        ) : (
          <QRCode value={address} color="rgba(10, 36, 79, 1)" size={350} />
        )}

        <Text>My LTC Address</Text>
        <Text>{address}</Text>
        <TouchableOpacity onPress={this.handlePress}>
          <Text>Copy to Clipboard</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 15
  }
});

Receive.propTypes = {
  getAddress: PropTypes.func,
  address: PropTypes.string
};

const mapStateToProps = state => ({
  address: state.address.address
});

const mapDispatchToProps = { getAddress };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Receive);
