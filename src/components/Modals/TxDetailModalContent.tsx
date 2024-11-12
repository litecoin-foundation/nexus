import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {
  subunitSelector,
  subunitSymbolSelector,
  defaultExplorerSelector,
} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';

interface Props {
    isOpened: boolean;
    close: () => void;
    showAnim: boolean;
    animDelay: number;
    animDuration: number;
    transaction: any;
}

export default function TxDetailModalContent(props: Props) {
  const {isOpened, close, showAnim, animDelay, animDuration, transaction} = props;
  const navigation = useNavigation<any>();

  // when no txs has been selected the transaction prop is null
  // to prevent errors return empty view
  // TODO: handle this in a better wayz
  if (transaction === null) {
    return <View />;
  }

  /* eslint-disable react-hooks/rules-of-hooks */
  const convertToSubunit = useSelector(state => subunitSelector(state));
  const cryptoAmount = convertToSubunit(transaction.amount);
  const amountSymbol = useSelector(state => subunitSymbolSelector(state));
  const explorerUrl = useSelector(state =>
    defaultExplorerSelector(state, transaction.hash),
  );

  const calculateFiatAmount = useSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(transaction.amount);

  const fee = transaction.fee;

  // console.log(transaction.addresses);

  return (
    <View style={styles.body}>
      <View style={styles.modalHeaderContainer}>
        <Text style={styles.modalHeaderTitle}>
          Sent
          <Text style={styles.modalHeaderSubtitle}>{' ' + cryptoAmount + amountSymbol}</Text>
        </Text>
        <GreyRoundButton onPress={() => close()} />
      </View>
      <View style={styles.fromToContainer}>
        <View style={styles.fromAndToIconContainer}>
          <View style={styles.fromAndToIcon} />
          <View style={styles.sentLine} />
        </View>
        <View style={styles.fromAndToTitlesContainer}>
          <Text style={styles.fromAndToTitle}>From</Text>
          <Text style={styles.fromAddressTitle}>Add</Text>
        </View>
      </View>
      <View style={styles.fromToContainer}>
      <View style={styles.fromAndToIconContainer}>
          <View style={styles.fromAndToIcon} />
        </View>
        <View style={styles.fromAndToTitlesContainer}>
          <Text style={styles.fromAndToTitle}>To</Text>
          <Text style={styles.toAddressTitle}>{transaction.addresses[0]}</Text>
        </View>
      </View>
      {/* <TableCell
        title="RECIPIENT"
        value={transaction.sign ? 'Them' : 'Me'}
      /> */}
      <TableCell
        title="TIME & DATE"
        value={`${transaction.day}, ${transaction.time}`}
      />
      <TableCell title="AMOUNT IN FIAT" value={`${fiatAmount}`} />
      <TableCell title="AMOUNT IN LTC" value={`${cryptoAmount}${amountSymbol}`} />
      <TableCell title="FEE" value={`${fee}${amountSymbol}`} />
      <View style={styles.buttonContainer}>
        <BlueButton
            value="View on Blockchain"
            onPress={() => {
              close();
              navigation.navigate('WebPage', {
                uri: explorerUrl,
              });
            }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
  },
  modalHeaderContainer: {
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: Dimensions.get('screen').height * 0.025,
    paddingRight: Dimensions.get('screen').height * 0.025,
    paddingTop: Dimensions.get('screen').height * 0.025,
    paddingBottom: Dimensions.get('screen').height * 0.025,
  },
  modalHeaderTitle: {
    color: '#3b3b3b',
    fontSize: Dimensions.get('screen').height * 0.028,
    fontWeight: '600',
    flexDirection: 'row',
  },
  modalHeaderSubtitle: {
    color: '#2c72ff',
    fontSize: Dimensions.get('screen').height * 0.03,
    fontWeight: '600',
  },
  fromToContainer: {
    height: Dimensions.get('screen').height * 0.15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: Dimensions.get('screen').height * 0.03,
  },
  fromAndToContainer: {
    height: '50%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  fromAndToIconContainer: {
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: Dimensions.get('screen').height * 0.03,
  },
  fromAndToIcon: {
    height: Dimensions.get('screen').height * 0.035,
    width: Dimensions.get('screen').height * 0.035,
    borderRadius: Dimensions.get('screen').height * 0.012,
    backgroundColor: 'red',
    overflow: 'hidden',
  },
  sentLine: {
    height: '100%',
    width: 1,
    backgroundColor: '#ccc',
    marginTop: Dimensions.get('screen').height * 0.01,
  },
  fromAndToTitlesContainer: {
    height: '100%',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  fromAndToTitle: {
    color: '#3b3b3b',
    fontSize: Dimensions.get('screen').height * 0.02,
    fontWeight: '600',
  },
  fromAddressTitle: {
    color: '#2c72ff',
    fontSize: Dimensions.get('screen').height * 0.025,
    fontWeight: '600',
  },
  toAddressTitle: {
    color: '#1ebc73',
    fontSize: Dimensions.get('screen').height * 0.025,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: Dimensions.get('screen').height * 0.03,
  },
});
