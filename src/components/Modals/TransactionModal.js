import React, {Component} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import TypeButton from '../Buttons/TypeButton';
import GreyRoundButton from '../Buttons/GreyRoundButton';

export class TransactionModal extends Component {
  render() {
    const {isVisible, close, navigate} = this.props;

    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()} // TODO: for whatever goddamn reason this doesn't work
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={styles.noMargin}>
        <View style={styles.container}>
          <View style={styles.modal}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>Transaction Type</Text>
              <GreyRoundButton onPress={() => close()} />
            </View>

            <Text style={styles.subtitleText}>CHOOSE TRANSACTION TYPE</Text>
            <View style={styles.typeContainer}>
              <TypeButton
                label="Lightning"
                imageSource={require('../../assets/images/lightning.png')}
                onPress={() => {
                  close();
                  navigate('LightningReceive');
                }}
              />
              <TypeButton
                label="Onchain"
                imageSource={require('../../assets/images/onchain.png')}
                onPress={() => {
                  close();
                  navigate('Receive');
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
    margin: 0,
  },
  modal: {
    backgroundColor: 'white',
    height: 220,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
  },
  button: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  typeContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
    marginTop: 10,
    paddingBottom: 150,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31,
  },
  subtitleText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  noMargin: {
    margin: 0,
  },
});

TransactionModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  type: PropTypes.string,
};

export default TransactionModal;
