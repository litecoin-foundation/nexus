import React, {Component} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import VerticalTableCell from '../Cells/VerticalTableCell';
import BlueButton from '../Buttons/BlueButton';

export class SendModal extends Component {
  render() {
    const {isVisible, close} = this.props;

    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipeComplete={() => close()}
        onBackdropPress={() => close()}
        backdropColor="rgb(19,58,138)"
        backdropOpacity={0.6}
        style={styles.noMargin}>
        <View style={styles.container}>
          <View style={styles.modal}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>Send</Text>
              <GreyRoundButton onPress={() => close()} />
            </View>

            <VerticalTableCell title="Recipient Address">
              <Text>Meow</Text>
            </VerticalTableCell>
            <View style={styles.modalList}>
              <TableCell title="AMOUNT IN FIAT" value="PLACEHOLDER" />
              <TableCell title="AMOUNT IN LTC" value="PLACEHOLDER" />
              <TableCell title="FEE" value="PLACEHOLDER" />
            </View>

            <View style={styles.modalButtonContainer}>
              <BlueButton
                value="Confirm Send"
                onPress={() => console.log('meow')}
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
    margin: 0,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    height: 500,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
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
  modalList: {
    height: 180,
  },
  modalButtonContainer: {
    alignItems: 'center',
  },
  noMargin: {
    margin: 0,
  },
});

SendModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
};

export default SendModal;
