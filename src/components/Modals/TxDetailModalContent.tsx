import React, {useEffect, useLayoutEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {v4 as uuidv4} from 'uuid';

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
    close: () => void;
    transaction: any;
    txsNum: number;
    setTransactionIndex: (txIndex: number) => void;
    cardTranslateAnim: any;
    cardOpacityAnim: any;
    prevNextCardOpacityAnim: any;
    paginationOpacityAnim: any;
}

export default function TxDetailModalContent(props: Props) {
  const {close, transaction, txsNum, setTransactionIndex, cardTranslateAnim, cardOpacityAnim, prevNextCardOpacityAnim, paginationOpacityAnim} = props;
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
    try {
      const req = await fetch(
        `https://litecoinspace.org/api/tx/${transaction.hash}`,
      );
      const data: any = await req.json();

      if (data.hasOwnProperty('vin')) {
        const prevoutAddress = data.vin[0].prevout.scriptpubkey_address;

        if (prevoutAddress.length <= 75) {
          setFromAddressSize(Dimensions.get('screen').height * 0.025);
        } else {
          setFromAddressSize(Dimensions.get('screen').height * 0.019);
        }

        setFromAddress(prevoutAddress);
      } else {
        throw new Error('No vin found.');
      }
    } catch {
      setFromAddress(null);
    }
  }

  useEffect(() => {
    getSender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const toAddress = transaction.addresses[0];
  const toAddressSize = toAddress.length <= 75 ? Dimensions.get('screen').height * 0.025 : Dimensions.get('screen').height * 0.019;

  const fadeNewDetailsOpacity = useSharedValue(1);
  const fadeNewDetailsIn = useAnimatedStyle(() => {
    return {
      opacity: fadeNewDetailsOpacity.value,
    };
  });
  useLayoutEffect(() => {
    fadeNewDetailsOpacity.value = 0;
  }, [transaction, fadeNewDetailsOpacity]);
  useEffect(() => {
    fadeNewDetailsOpacity.value = withTiming(1, {duration: 500});
  }, [transaction, fadeNewDetailsOpacity]);

  const activeBulletNum = transaction.index + 1;

  const RenderPagination = useCallback(() => {
    const buttons: any = [];
    const maxBulletsNum = 5;
    const bulletsNum = txsNum > maxBulletsNum ? maxBulletsNum : txsNum;

    const middleRightOffset = txsNum > maxBulletsNum ? Math.ceil(maxBulletsNum / 2) - 1 : 0;
    let leftOffset = activeBulletNum > maxBulletsNum - middleRightOffset ? activeBulletNum - maxBulletsNum + middleRightOffset : 0;
    if (activeBulletNum > txsNum - middleRightOffset) {
      leftOffset = txsNum - maxBulletsNum;
    }

    for (let i = 1 + leftOffset; i <= bulletsNum + leftOffset; i++) {
      const offsetOpacity = (1 / bulletsNum) * (bulletsNum - Math.abs(i - activeBulletNum));

      let size = 0.65;
      if (i === activeBulletNum) {
        size = 0.9;
      }
      buttons.push(
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setTransactionIndex(i - 1);
          }}
          style={styles.bulletTouchContainer}
          key={uuidv4()}>
          <View style={[styles.bullet, {opacity: offsetOpacity, transform: [{scale: size}]}]} />
        </TouchableOpacity>
      );
    }

    return buttons;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBulletNum]);

  return (
    <>
      <Animated.View style={[styles.pagination, paginationOpacityAnim]}>
        <View style={styles.paginationBullets}>
          <RenderPagination />
        </View>
      </Animated.View>
      <Animated.View style={[styles.container, cardTranslateAnim]}>
        <Animated.View style={[styles.fakeCardLeft, prevNextCardOpacityAnim]} />
        <Animated.View style={[styles.fakeCardRight, prevNextCardOpacityAnim]} />
        <Animated.View style={[styles.body,cardOpacityAnim]}>
          <Animated.View style={[styles.fadingContent, fadeNewDetailsIn]}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>
                Sent
                <Text style={styles.modalHeaderSubtitle}>{' ' + parseFloat(cryptoAmount).toFixed(2) + amountSymbol + ' (' + fiatAmount + ')'}</Text>
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
            <TableCell title="FEE" value={`${fee}${amountSymbol}`}/>
            <View style={styles.buttonContainer}>
              <BlueButton
                  value="View on Blockchain"
                  onPress={() => {
                    navigation.navigate('WebPage', {
                      uri: currentExplorer,
                    });
                  }}
              />
            </View>
            <View style={styles.paginationTape} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
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
    borderTopLeftRadius: Dimensions.get('screen').height * 0.04,
    borderTopRightRadius: Dimensions.get('screen').height * 0.04,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  fakeCardLeft: {
    position: 'absolute',
    bottom: 0,
    right: '100%',
    height: '100%',
    width: '100%',
    borderTopLeftRadius: Dimensions.get('screen').height * 0.04,
    borderTopRightRadius: Dimensions.get('screen').height * 0.04,
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
    borderTopLeftRadius: Dimensions.get('screen').height * 0.04,
    borderTopRightRadius: Dimensions.get('screen').height * 0.04,
    backgroundColor: 'white',
    overflow: 'hidden',
    zIndex: 1,
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: Dimensions.get('screen').height * 0.06,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 2,
  },
  paginationTape: {
    height: Dimensions.get('screen').height * 0.06,
    width: '100%',
    backgroundColor: '#f7f7f7',
  },
  paginationBullets: {
    height: '100%',
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bulletTouchContainer: {
    height: Dimensions.get('screen').height * 0.06,
    width: Dimensions.get('screen').height * 0.04,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bullet: {
    height: Dimensions.get('screen').height * 0.02,
    width: Dimensions.get('screen').height * 0.02,
    borderRadius: Dimensions.get('screen').height * 0.01,
    backgroundColor: '#2c72ff',
  },
  fadingContent: {
    height: '100%',
    width: '100%',
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
  ltcNumColor: {
    color: '#2c72ff',
  },
});
