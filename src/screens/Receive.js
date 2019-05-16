import React, { Component } from 'react';
import { View, Text, StyleSheet, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import PropTypes from 'prop-types';

import RequestModal from '../components/RequestModal';
import BlueClearButton from '../components/BlueClearButton';
import { getAddress } from '../reducers/address';
import * as bip21 from '../lib/utils/bip21';

export class Receive extends Component {
  state = {
    modalTriggered: false,
    amount: '',
    uri: ''
  };

  async componentDidMount() {
    const { getAddress } = this.props;
    await getAddress();

    const { address } = this.props;
    this.setState({ uri: address });
  }

  setModalVisible(bool) {
    this.setState({ modalTriggered: bool });
  }

  handlePress = async () => {
    const { address } = this.props;
    await Clipboard.setString(address);
  };

  handleChange = input => {
    this.setState({ amount: input }, () => this.updateQR());
  };

  updateQR = () => {
    const { amount } = this.state;
    const { address } = this.props;
    this.setState({ uri: bip21.encodeBIP21(address, { amount }) });
  };

  render() {
    const { address } = this.props;
    const { modalTriggered, uri } = this.state;
    return (
      <View style={styles.container}>
        {!uri ? (
          <Text>loading...</Text>
        ) : (
          <View style={{ paddingTop: 15, paddingBottom: 15 }}>
            <QRCode value={uri} color="rgba(10, 36, 79, 1)" size={350} />
          </View>
        )}
        <View style={styles.details}>
          <View style={{ paddingTop: 20, paddingLeft: 20 }}>
            <Text style={{ color: '#7C96AE', fontSize: 14, fontWeight: 'bold' }}>
              My LTC Address
            </Text>
            <Text style={{ color: '#20BB74', fontSize: 16, fontWeight: '600' }}>{address}</Text>
          </View>
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <View style={{ paddingBottom: 20 }}>
              <BlueClearButton value="Copy to Clipboard" onPress={this.handlePress} />
            </View>
            <View
              style={{
                paddingTop: 20,
                borderTopColor: 'rgba(151, 151, 151, 0.3)',
                borderTopWidth: 1
              }}
            >
              <BlueClearButton
                value="Request Specific Amount"
                onPress={() => this.setModalVisible(true)}
              />
            </View>
          </View>
        </View>

        <RequestModal
          isVisible={modalTriggered}
          close={() => this.setModalVisible(false)}
          onChange={input => this.handleChange(input)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  details: {
    flex: 1,
    backgroundColor: '#F6F9FC',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(151, 151, 151, 0.3)'
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
