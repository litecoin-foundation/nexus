import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Animated from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {formatTxDate} from '../../lib/utils/date';

import {
  subunitSelector,
  subunitSymbolSelector,
  defaultExplorerSelector,
  mwebDefaultExplorerSelector,
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
    cardOpacityAnim: any;
    prevNextCardOpacityAnim: any;
}

export default function TxDetailModalContent(props: Props) {
  const {isOpened, close, showAnim, animDelay, animDuration, transaction, cardOpacityAnim, prevNextCardOpacityAnim} = props;
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
  const mwebExplorerUrl = useSelector(state =>
    mwebDefaultExplorerSelector(state, transaction.blockHeight),
  );
  const currentExplorer = {
    current: function () {
      if (transaction.addresses[0].substring(0, 7) === 'ltcmweb') {
        return mwebExplorerUrl;
      } else {
        return explorerUrl;
      }
    },
  }.current();

  const calculateFiatAmount = useSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(transaction.amount);

  const fee = transaction.fee;

  const dateString = formatTxDate(transaction.timestamp);

  // TODO
  // const recipient = transaction.sign ? 'Them' : 'Me';

  const [fromAddressSize, setFromAddressSize] = useState(Dimensions.get('screen').height * 0.025);
  const [fromAddress, setFromAddress] = useState(null);

  async function getSender() {
    const req = await fetch(
      `https://litecoinspace.org/api/tx/${transaction.hash}`,
    );
    const data: any = await req.json();

    if (data.hasOwnProperty('vin')) {
      const prevoutAddress = data.vin[0].prevout.scriptpubkey_address;

      if (prevoutAddress.length <= 75) {
        setFromAddressSize(Dimensions.get('screen').height * 0.025);
      } else {
        setFromAddressSize(Dimensions.get('screen').height * 0.02);
      }

      setFromAddress(prevoutAddress);
    }
  }

  useEffect(() => {
    if (!fromAddress) {
      getSender();
    }
  }, [fromAddress]);

  const toAddress = transaction.addresses[0];
  const toAddressSize = toAddress.length <= 75 ? Dimensions.get('screen').height * 0.025 : Dimensions.get('screen').height * 0.02;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fakeCardLeft, prevNextCardOpacityAnim]} />
      <Animated.View style={[styles.fakeCardRight, prevNextCardOpacityAnim]} />
      <Animated.View style={[styles.body, cardOpacityAnim]}>
        <View style={styles.modalHeaderContainer}>
          <Text style={styles.modalHeaderTitle}>
            Sent
            <Text style={styles.modalHeaderSubtitle}>{' ' + cryptoAmount + amountSymbol}</Text>
          </Text>
          <GreyRoundButton onPress={() => close()} />
        </View>
        <View style={styles.fromToContainer}>
          <View style={styles.fromContainer}>
            <View style={styles.fromAndToIconContainer}>
              <View style={styles.fromAndToIcon} />
              <View style={styles.sentLine} />
            </View>
            <View style={styles.fromAndToTitlesContainer}>
              <Text style={styles.fromAndToTitle}>From</Text>
              <Text style={{...styles.fromAddressTitle, fontSize: fromAddressSize}}>{fromAddress}</Text>
            </View>
          </View>
          <View style={styles.toContainer}>
            <View style={styles.fromAndToIconContainer}>
              <View style={styles.fromAndToIcon} />
            </View>
            <View style={styles.fromAndToTitlesContainer}>
              <Text style={styles.fromAndToTitle}>To</Text>
              <Text style={{...styles.toAddressTitle, fontSize: toAddressSize}}>{toAddress}</Text>
            </View>
          </View>
        </View>
        <TableCell
          title="TIME & DATE"
          value={dateString}
        />
        <TableCell title="AMOUNT IN FIAT" value={`${fiatAmount}`} />
        <TableCell title="AMOUNT IN LTC" value={`${cryptoAmount}${amountSymbol}`} valueStyle={{color: '#2c72ff'}} />
        <TableCell title="FEE" value={`${fee}${amountSymbol}`}/>
        <View style={styles.buttonContainer}>
          <BlueButton
              value="View on Blockchain"
              onPress={() => {
                // close();
                navigation.navigate('WebPage', {
                  uri: currentExplorer,
                });
              }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
    width: '100%',
  },
  body: {
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  fakeCardLeft: {
    position: 'absolute',
    bottom: 0,
    right: '100%',
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'white',
    overflow: 'hidden',
    zIndex: 1,
  },
  fakeCardRight: {
    position: 'absolute',
    bottom: 0,
    left: '100%',
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'white',
    overflow: 'hidden',
    zIndex: 1,
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
    height: Dimensions.get('screen').height * 0.3,
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: Dimensions.get('screen').height * 0.03,
  },
  fromContainer: {
    flexBasis: '60%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  toContainer: {
    flex: 1,
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
    flex: 1,
    width: 1,
    backgroundColor: '#ccc',
    margin: Dimensions.get('screen').height * 0.01,
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
