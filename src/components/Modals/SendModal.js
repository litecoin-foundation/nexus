import React, {Fragment} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import VerticalTableCell from '../Cells/VerticalTableCell';
import BlueButton from '../Buttons/BlueButton';

const SendModal = (props) => {
  const {isVisible, close, amount, address, memo, handleConfirm} = props;

  const DescriptionView = () => (
    <Fragment>
      <VerticalTableCell title="Recipient Address">
        <Text style={styles.addressText}>{address}</Text>
      </VerticalTableCell>
      <View style={styles.modalList}>
        <TableCell
          title="AMOUNT IN LTC"
          value={`${amount}Ł`}
          valueStyle={styles.ltcText}
        />
        <TableCell
          title="AMOUNT IN FIAT"
          value="PLACEHOLDER"
          valueStyle={styles.fiatText}
        />
        {memo ? <TableCell title="DESCRIPTION" value={memo} /> : null}
        <TableCell title="FEE" value="PLACEHOLDER" />
      </View>
      <View style={styles.modalButtonContainer}>
        <BlueButton
          value="Confirm"
          onPress={() => {
            handleConfirm();
          }}
        />
      </View>
    </Fragment>
  );

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
          <DescriptionView />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    height: 650,
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
    bottom: 30,
    position: 'absolute',
    alignSelf: 'center',
  },
  noMargin: {
    margin: 0,
  },
  flex: {
    flex: 1,
  },
  addressText: {
    color: '#20BB74',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.54,
  },
  ltcText: {
    color: '#2C72FF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.68,
  },
  fiatText: {
    color: '#20BB74',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.68,
  },
  dotStyle: {
    width: 9,
    height: 9,
    borderRadius: 9 / 2,
    marginHorizontal: 5,
  },
});

export default SendModal;
