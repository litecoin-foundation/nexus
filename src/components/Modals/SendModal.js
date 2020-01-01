import React, {useState, Fragment, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {useSelector} from 'react-redux';
import {Pagination} from 'react-native-snap-carousel';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import VerticalTableCell from '../Cells/VerticalTableCell';
import BlueButton from '../Buttons/BlueButton';
import AuthPad from '../Numpad/AuthPad';

const SendModal = props => {
  const {isVisible, close, amount, address, memo} = props;
  const [confirmed, confirm] = useState(false);
  const pin = useSelector(state => state.authpad.pin);

  const handleConfirm = () => {
    if (!confirmed) {
      confirm(true);
    }
  };

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

          {!confirmed ? (
            <Fragment>
              <VerticalTableCell title="Recipient Address">
                <Text>{address}</Text>
              </VerticalTableCell>
              <View style={styles.modalList}>
                <TableCell title="AMOUNT IN LTC" value={amount} />
                <TableCell title="AMOUNT IN FIAT" value="PLACEHOLDER" />
                {memo ? <TableCell title="DESCRIPTION" value={memo} /> : null}
                <TableCell title="FEE" value="PLACEHOLDER" />
              </View>
            </Fragment>
          ) : (
            <View style={{flex: 1}}>
              <Pagination
                containerStyle={{borderWidth: 1}}
                dotStyle={{
                  width: 9,
                  height: 9,
                  borderRadius: 9 / 2,
                  marginHorizontal: 5,
                }}
                inactiveDotColor="#2C72FF"
                dotColor="#2C72FF"
                dotsLength={6}
                activeDotIndex={pin.length - 1}
              />

              <AuthPad />
            </View>
          )}

          <View style={styles.modalButtonContainer}>
            <BlueButton
              value={!confirmed ? 'Confirm' : 'Confirm Send'}
              onPress={() => {
                handleConfirm();
              }}
            />
          </View>
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
  },
  noMargin: {
    margin: 0,
  },
});

export default SendModal;
