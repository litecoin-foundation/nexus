import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import VerticalTableCell from '../Cells/VerticalTableCell';
import BlueButton from '../Buttons/BlueButton';
import {useAppSelector} from '../../store/hooks';
import {fiatValueSelector} from '../../reducers/ticker';
import {subunitSelector, subunitSymbolSelector} from '../../reducers/settings';

interface Props {
  handleConfirm(): void;
  close(): void;
  isVisible: boolean;
  amount: number;
  address: string;
  memo?: string;
}

const SendModal: React.FC<Props> = props => {
  const {handleConfirm, close, isVisible, amount, address, memo} = props;

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const convertToSubunit = useAppSelector(state => subunitSelector(state));
  const subunitAmount = convertToSubunit(amount);
  const subunitSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const fiatAmount = calculateFiatAmount(amount);

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
            <Text style={styles.addressText}>{address}</Text>
          </VerticalTableCell>
          <View style={styles.modalList}>
            <TableCell
              title="Litecoin Amount"
              value={`${subunitAmount}${subunitSymbol}`}
              valueStyle={styles.ltcText}
            />
            <TableCell
              title="AMOUNT IN FIAT"
              value={fiatAmount}
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
