import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';
import {useNavigation} from 'react-navigation-hooks';

import GreyRoundButton from './GreyRoundButton';
import TableCell from './TableCell';
import VerticalTableCell from './VerticalTableCell';
import BlueButton from './BlueButton';

const TransactionDetailModal = props => {
  const {navigate} = useNavigation();
  const {isVisible, close, transaction} = props;

  if (transaction === null) {
    return <View />;
  }

  const addresses = transaction.addresses.map(val => {
    return (
      <Text key={val} style={styles.text}>
        {val}
      </Text>
    );
  });

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

          <ScrollView>
            <TableCell
              title="SENDER"
              value={transaction.sign ? 'Me' : 'Them'}
            />
            <TableCell
              title="RECIPIENT"
              value={transaction.sign ? 'Them' : 'Me'}
            />
            <TableCell
              title="TIME & DATE"
              value={`${transaction.day}, ${transaction.time}`}
            />
            <TableCell title="AMOUNT IN FIAT" value="PLACEHOLDER" />
            <TableCell title="AMOUNT IN LTC" value={`${transaction.amount}Ł`} />
            <VerticalTableCell title="ADDRESSES">{addresses}</VerticalTableCell>
            <VerticalTableCell title="TRANSACTION ID (txid)">
              <Text style={styles.text}>{transaction.hash}</Text>
            </VerticalTableCell>
            <View style={styles.buttonContainer}>
              <BlueButton
                small={false}
                value="View on Blockchain"
                onPress={() => {
                  close();
                  navigate({
                    routeName: 'WebPage',
                    params: {
                      uri: `https://insight.litecore.io/tx/${transaction.hash}`,
                    },
                  });
                }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  modal: {
    backgroundColor: 'white',
    height: 700,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    height: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

TransactionDetailModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
};

export default TransactionDetailModal;
