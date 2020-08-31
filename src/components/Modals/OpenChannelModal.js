import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import AmountInput from '../AmountInput';

const OpenChannelModal = (props) => {
  const {isVisible, close, handleConfirm, onChange} = props;

  const DescriptionView = () => (
    <View style={styles.amountInputContainer}>
      <AmountInput
        onChangeText={(input) => onChange(input)}
        toggleWithoutSelection
        onAccept={handleConfirm}
        confirmButtonText="Confirm Channel"
      />
    </View>
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
            <Text style={styles.modalHeaderTitle}>Open Channel</Text>
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
  amountInputContainer: {
    height: 520,
    flex: 1,
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31,
  },
  noMargin: {
    margin: 0,
  },
});

export default OpenChannelModal;
