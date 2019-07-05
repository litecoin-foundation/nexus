import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import TypeButton from './TypeButton';
import GreyRoundButton from './GreyRoundButton';

export class TransactionModal extends Component {
  render() {
    const { isVisible, close, navigate, type } = this.props;
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
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>Transaction Type</Text>
              <GreyRoundButton onPress={() => close()} />
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                Lightning transactions are blah blah blah, while on chain...
              </Text>
            </View>

            <Text style={styles.subtitleText}>CHOOSE TRANSACTION TYPE</Text>
            <View style={styles.typeContainer}>
              <TypeButton
                label="Lightning"
                onPress={() => {
                  close();
                  navigate(LightningView);
                }}
              />
              <TypeButton
                label="Onchain"
                onPress={() => {
                  close();
                  navigate(OnchainView);
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
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31
  },
  descriptionContainer: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 30
  },
  descriptionText: {
    opacity: 0.9,
    color: '#4E6070',
    fontSize: 16,
    fontWeight: '500'
  },
  subtitleText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 40,
    paddingBottom: 20
  }
});

TransactionModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  type: PropTypes.string
};

export default TransactionModal;
