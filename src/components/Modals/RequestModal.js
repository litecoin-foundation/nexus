import React, {Component} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import AmountInput from '../AmountInput';
import GreyRoundButton from '../Buttons/GreyRoundButton';

export class RequestModal extends Component {
  render() {
    const {isVisible, close, onChange} = this.props;
    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()}
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={styles.noMargin}>
        <View style={styles.modal}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalHeaderTitle}>Choose Amount</Text>
            <GreyRoundButton onPress={() => close()} />
          </View>
          <View style={styles.amountInputContainer}>
            <AmountInput
              onChangeText={input => onChange(input)}
              toggleWithoutSelection
              onAccept={() => close()}
              confirmButtonText="Request"
            />
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    height: 640,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
  },
  textContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
    paddingBottom: 25,
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31,
  },
  amountInputContainer: {
    height: 520,
  },
  text: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.36,
    color: '#484859',
  },
  noMargin: {
    margin: 0,
  },
});

RequestModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RequestModal;
