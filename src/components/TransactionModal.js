import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import TypeButton from './TypeButton';

export class TransactionModal extends Component {
  render() {
    const { isVisible, close, navigation, type } = this.props;
    const LightningView = type === 'send' ? 'LightningSend' : 'LightningReceive';
    const OnchainView = type === 'send' ? 'Send' : 'Receive';

    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()} // TODO: for whatever goddamn reason this doesn't work
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={{ margin: 0 }}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            <TouchableOpacity
              onPress={() => {
                close();
              }}
            >
              <Text>Hide Modal</Text>
            </TouchableOpacity>
            <Text>Transaction Type</Text>
            <Text>Lightning transactions are blah blah blah, while on chain...</Text>
            <Text>CHOOSE TRANSACTION TYPE</Text>
            <View style={styles.typeContainer}>
              <TypeButton
                label="Lightning"
                onPress={() => {
                  close();
                  navigation.navigate(LightningView);
                }}
              />
              <TypeButton
                label="Onchain"
                onPress={() => {
                  close();
                  navigation.navigate(OnchainView);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0
  },
  modal: {
    backgroundColor: 'white',
    height: 300,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0
  },
  button: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14
  },
  typeContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
    marginTop: 10,
    paddingBottom: 150
  }
});

TransactionModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired,
  type: PropTypes.string
};

export default TransactionModal;
