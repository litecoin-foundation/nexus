import React from 'react';
import {View, Text, StyleSheet, Pressable, Alert} from 'react-native';
import Modal from 'react-native-modal';
import {useSelector} from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';

import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  defaultExplorerSelector,
} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import VerticalTableCell from '../Cells/VerticalTableCell';
import BlueButton from '../Buttons/BlueButton';
import {triggerMediumFeedback} from '../../lib/utils/haptic';

const TransactionDetailModal = props => {
  const {isVisible, close, transaction, navigate} = props;

  // when no txs has been selected the transaction prop is null
  // to prevent errors return empty view
  // TODO: handle this in a better way
  if (transaction === null) {
    return <View />;
  }

  /* eslint-disable react-hooks/rules-of-hooks */
  const convertToSubunit = useSelector(state => satsToSubunitSelector(state));
  const cryptoAmount = convertToSubunit(transaction.amount);
  const amountSymbol = useSelector(state => subunitSymbolSelector(state));
  const explorerUrl = useSelector(state =>
    defaultExplorerSelector(state, transaction.hash),
  );

  const calculateFiatAmount = useSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(transaction.amount);

  const addresses = transaction.addresses.map(val => {
    return (
      <Text key={val} style={styles.text}>
        {val}
      </Text>
    );
  });

  const onLongPress = async item => {
    Alert.alert('Copied', null, [], {cancelable: true});
    triggerMediumFeedback();
    Clipboard.setString(item);
  };

  return (
    <Modal
      isVisible={isVisible}
      swipeDirection="down"
      onSwipeComplete={() => close()}
      backdropColor="rgb(19,58,138)"
      backdropOpacity={0.6}
      style={styles.noMargin}>
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalHeaderTitle}>Transaction</Text>
            <GreyRoundButton onPress={() => close()} />
          </View>

          <TableCell
            title="RECIPIENT"
            value={transaction.sign ? 'Them' : 'Me'}
          />
          <TableCell
            title="TIME & DATE"
            value={`${transaction.day}, ${transaction.time}`}
          />
          <TableCell title="AMOUNT" value={`${cryptoAmount}${amountSymbol}`} />
          <TableCell title="AMOUNT IN FIAT" value={`${fiatAmount}`} />
          <VerticalTableCell title="ADDRESSES">{addresses}</VerticalTableCell>
          <VerticalTableCell title="TRANSACTION ID (txid)">
            <Pressable onLongPress={() => onLongPress(transaction.hash)}>
              <Text style={styles.text}>{transaction.hash}</Text>
            </Pressable>
          </VerticalTableCell>
          <View style={styles.buttonContainer}>
            <BlueButton
              small={false}
              value="View on Blockchain"
              onPress={() => {
                close();
                navigate('WebPage', {
                  uri: explorerUrl,
                });
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
  },
  modal: {
    flex: 1,
    backgroundColor: '',
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
  noMargin: {
    margin: 0,
  },
  buttonContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    height: 120,
    width: 335,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TransactionDetailModal;
