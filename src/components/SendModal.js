import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

export class FeeModal extends Component {
  render() {
    const { isVisible, close, address, amount, fee } = this.props;

    return (
      <View>
        <Modal
          isVisible={isVisible}
          swipeDirection="down"
          onSwipeComplete={() => close()}
          onBackdropPress={() => close()}
          backdropColor="rgb(19,58,138)"
          backdropOpacity={0.6}
          style={{ margin: 0 }}
        >
          <View style={styles.modal}>
            <View>
              <TouchableOpacity onPress={() => close()}>
                <Text>Hide Modal</Text>
              </TouchableOpacity>

              <Text>Send</Text>

              <View>
                <Text>Recipient Address</Text>
                <Text>{address}</Text>
              </View>
              <View>
                <Text>AMOUNT IN FIAT</Text>
                <Text>{amount}</Text>
              </View>
              <View>
                <Text>AMOUNT IN LTC</Text>
                <Text>{amount}</Text>
              </View>
              <View>
                <Text>FEE</Text>
                <Text>{fee}</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    backgroundColor: 'white',
    height: 300,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center'
  }
});

FeeModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  fee: PropTypes.number.isRequired
};

export default FeeModal;
