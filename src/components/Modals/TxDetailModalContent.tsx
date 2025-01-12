import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useContext,
  Fragment,
} from 'react';
import {View, Text, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {v4 as uuidv4} from 'uuid';

import {formatTxDate} from '../../lib/utils/date';
import {IDisplayedTx} from '../../reducers/transaction';
import {
  subunitSelector,
  subunitSymbolSelector,
  defaultExplorerSelector,
  mwebDefaultExplorerSelector,
  getCurrencySymbol,
} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';
import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import GreenButton from '../Buttons/GreenButton';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  close: () => void;
  transaction: IDisplayedTx;
  txsNum: number;
  setTransactionIndex: (txIndex: number) => void;
  cardTranslateAnim: any;
  cardOpacityAnim: any;
  prevNextCardOpacityAnim: any;
  paginationOpacityAnim: any;
}

interface SendReceiveLayoutProps {
  fromAddress: string;
  fromAddressSize: number;
  toAddress: string;
  toAddressSize: number;
  dateString: string;
  amountSymbol: string;
  currentExplorer: string;
  blockchainFee: number;
}

interface SellBuyLayoutProps {
  fiatSymbol: string;
  moonpayTxId: string;
  cryptoTxId: string;
  createdAt: string;
  // updatedAt: string;
  // walletAddress: string;
  // cryptoCurrency: string;
  // fiatCurrency: string;
  // cryptoCurrencyAmount: number;
  fiatCurrencyAmount: number;
  // usdRate: number;
  // eurRate: number;
  // gbpRate: number;
  totalFee: number;
  blockchainFee: number;
  tipLFFee: number;
  moonpayFee: number;
  txDetailsUrl: string;
  status: string;
  // country: string;
  // paymentMethod: string;
  currentExplorer: string;
}

export default function TxDetailModalContent(props: Props) {
  const {
    close,
    transaction,
    txsNum,
    setTransactionIndex,
    cardTranslateAnim,
    cardOpacityAnim,
    prevNextCardOpacityAnim,
    paginationOpacityAnim,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {label} = {
    current: function () {
      switch (transaction.metaLabel) {
        case 'Send':
          return {
            label: 'Sent',
            txIcon: require('../../assets/icons/sendtx.png'),
            amountColor: '#212124',
            mathSign: '-',
          };
        case 'Receive':
          return {
            label: 'Received',
            txIcon: require('../../assets/icons/receivetx.png'),
            amountColor: '#1162E6',
            mathSign: '+',
          };
        case 'Buy':
          return {
            label: 'Bought',
            txIcon: require('../../assets/icons/buytx.png'),
            amountColor: '#1162E6',
            mathSign: '+',
          };
        case 'Sell':
          return {
            label: 'Spent',
            txIcon: require('../../assets/icons/selltx.png'),
            amountColor: '#212124',
            mathSign: '-',
          };
        default:
          return {
            label: 'Unknown',
            txIcon: null,
            amountColor: '#212124',
            mathSign: '',
          };
      }
    },
  }.current();

  /* eslint-disable react-hooks/rules-of-hooks */
  const convertToSubunit = useSelector(state => subunitSelector(state));
  const cryptoAmount = convertToSubunit(transaction.amount);
  const amountSymbol = useSelector(state => subunitSymbolSelector(state));
  const calculateFiatAmount = useSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(transaction.amount);
  const dateString = formatTxDate(transaction.timestamp);

  const [fromAddressSize, setFromAddressSize] = useState(SCREEN_HEIGHT * 0.025);
  const [fromAddress, setFromAddress] = useState<string>('');

  async function getSender() {
    try {
      const req = await fetch(
        `https://litecoinspace.org/api/tx/${transaction.hash}`,
      );
      const data: any = await req.json();

      if (data.hasOwnProperty('vin')) {
        const prevoutAddress = data.vin[0].prevout.scriptpubkey_address;

        if (prevoutAddress.length <= 75) {
          setFromAddressSize(SCREEN_HEIGHT * 0.025);
        } else {
          setFromAddressSize(SCREEN_HEIGHT * 0.019);
        }

        setFromAddress(prevoutAddress);
      } else {
        throw new Error('No vin found.');
      }
    } catch {
      setFromAddress('');
    }
  }

  useEffect(() => {
    getSender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const toAddress = transaction.addresses[0];
  const toAddressSize =
    toAddress.length <= 75 ? SCREEN_HEIGHT * 0.025 : SCREEN_HEIGHT * 0.019;

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

  const activeBulletNum = transaction.renderIndex + 1;

  const RenderPagination = useCallback(() => {
    const buttons: any = [];
    const maxBulletsNum = 5;
    const bulletsNum = txsNum > maxBulletsNum ? maxBulletsNum : txsNum;

    const middleRightOffset =
      txsNum > maxBulletsNum ? Math.ceil(maxBulletsNum / 2) - 1 : 0;
    let leftOffset =
      activeBulletNum > maxBulletsNum - middleRightOffset
        ? activeBulletNum - maxBulletsNum + middleRightOffset
        : 0;
    if (activeBulletNum > txsNum - middleRightOffset) {
      leftOffset = txsNum - maxBulletsNum;
    }

    for (let i = 1 + leftOffset; i <= bulletsNum + leftOffset; i++) {
      const offsetOpacity =
        (1 / bulletsNum) * (bulletsNum - Math.abs(i - activeBulletNum));

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
          <View
            style={[
              styles.bullet,
              {opacity: offsetOpacity, transform: [{scale: size}]},
            ]}
          />
        </TouchableOpacity>,
      );
    }

    return buttons;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBulletNum]);

  const {
    fiatSymbol,
    moonpayTxId,
    cryptoTxId,
    createdAt,
    // fiatCurrency,
    fiatCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    moonpayFee,
    txDetailsUrl,
    status,
    // paymentMethod,
    currentExplorer,
  } = {
    current: function () {
      let fiatSymbolProp = '';
      let moonpayTxIdProp = '';
      let cryptoTxIdProp = '';
      let createdAtProp = '';
      // let fiatCurrencyProp = '';
      let fiatCurrencyAmountProp = 0;
      let totalFeeProp = 0;
      let blockchainFeeProp = 0;
      let tipLFFeeProp = 0;
      let moonpayFeeProp = 0;
      let txDetailsUrlProp = '';
      let statusProp = '';
      // let paymentMethodProp = '';
      let currentExplorerProp = '';

      if (transaction.moonpayMeta) {
        fiatSymbolProp = getCurrencySymbol(
          transaction.moonpayMeta.fiatCurrency,
        );
        moonpayTxIdProp = transaction.moonpayMeta.moonpayTxId;
        cryptoTxIdProp = transaction.moonpayMeta.cryptoTxId;
        createdAtProp = formatTxDate(
          parseInt(
            String(Date.parse(transaction.moonpayMeta.createdAt) / 1000),
            10,
          ),
        );
        // fiatCurrencyProp = transaction.moonpayMeta.fiatCurrency;
        fiatCurrencyAmountProp = transaction.moonpayMeta.fiatCurrencyAmount;
        totalFeeProp = transaction.moonpayMeta.totalFee;
        blockchainFeeProp = transaction.moonpayMeta.blockchainFee;
        tipLFFeeProp = transaction.moonpayMeta.tipLFFee;
        moonpayFeeProp = transaction.moonpayMeta.moonpayFee;
        txDetailsUrlProp = transaction.moonpayMeta.txDetailsUrl;
        statusProp = transaction.moonpayMeta.status;
        // paymentMethodProp = transaction.moonpayMeta.paymentMethod;
      } else {
        totalFeeProp = transaction.fee;
        blockchainFeeProp = transaction.fee;
      }

      if (transaction.addresses[0].substring(0, 7) === 'ltcmweb') {
        currentExplorerProp = useSelector(state =>
          mwebDefaultExplorerSelector(state, transaction.blockHeight),
        );
      } else {
        currentExplorerProp = useSelector(state =>
          defaultExplorerSelector(state, transaction.hash),
        );
      }

      return {
        fiatSymbol: fiatSymbolProp,
        moonpayTxId: moonpayTxIdProp,
        cryptoTxId: cryptoTxIdProp,
        createdAt: createdAtProp,
        // fiatCurrency: fiatCurrencyProp,
        fiatCurrencyAmount: fiatCurrencyAmountProp,
        totalFee: totalFeeProp,
        blockchainFee: blockchainFeeProp,
        tipLFFee: tipLFFeeProp,
        moonpayFee: moonpayFeeProp,
        txDetailsUrl: txDetailsUrlProp,
        status: statusProp,
        // paymentMethod: paymentMethodProp,
        currentExplorer: currentExplorerProp,
      };
    },
  }.current();

  return (
    <>
      <Animated.View style={[styles.pagination, paginationOpacityAnim]}>
        <View style={styles.paginationBullets}>
          <RenderPagination />
        </View>
      </Animated.View>
      <Animated.View style={[styles.container, cardTranslateAnim]}>
        <Animated.View style={[styles.fakeCardLeft, prevNextCardOpacityAnim]} />
        <Animated.View
          style={[styles.fakeCardRight, prevNextCardOpacityAnim]}
        />
        <Animated.View style={[styles.body, cardOpacityAnim]}>
          <Animated.View style={[styles.fadingContent, fadeNewDetailsIn]}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>
                {label}
                <Text style={styles.modalHeaderSubtitle}>
                  {' ' +
                    parseFloat(cryptoAmount).toFixed(2) +
                    amountSymbol +
                    ' (' +
                    fiatAmount +
                    ')'}
                </Text>
              </Text>
              <GreyRoundButton onPress={() => close()} />
            </View>
            <View style={styles.modalContentContainer}>
              {transaction.metaLabel === 'Send' ||
              transaction.metaLabel === 'Receive' ? (
                <SendReceiveLayout
                  fromAddress={fromAddress}
                  fromAddressSize={fromAddressSize}
                  toAddress={toAddress}
                  toAddressSize={toAddressSize}
                  dateString={dateString}
                  amountSymbol={amountSymbol}
                  currentExplorer={currentExplorer}
                  blockchainFee={blockchainFee}
                />
              ) : (
                <SellBuyLayout
                  fiatSymbol={fiatSymbol}
                  moonpayTxId={moonpayTxId}
                  cryptoTxId={cryptoTxId}
                  createdAt={createdAt}
                  // fiatCurrency={fiatCurrency}
                  fiatCurrencyAmount={fiatCurrencyAmount}
                  totalFee={totalFee}
                  blockchainFee={blockchainFee}
                  tipLFFee={tipLFFee}
                  moonpayFee={moonpayFee}
                  txDetailsUrl={txDetailsUrl}
                  status={status}
                  // paymentMethod={paymentMethod}
                  currentExplorer={currentExplorer}
                />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const SellBuyLayout: React.FC<SellBuyLayoutProps> = props => {
  const {
    fiatSymbol,
    moonpayTxId,
    cryptoTxId,
    createdAt,
    // fiatCurrency,
    fiatCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    moonpayFee,
    txDetailsUrl,
    status,
    // paymentMethod,
    currentExplorer,
  } = props;

  const navigation = useNavigation<any>();

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return (
    <Fragment>
      <Text style={styles.statusText}>{status}</Text>
      <TableCell title="TOTAL" value={`${fiatSymbol}${fiatCurrencyAmount}`} />
      <TableCell title="TOTAL FEE" value={`${fiatSymbol}${totalFee}`} />
      <TableCell
        title="MOONPAY ID"
        value={moonpayTxId}
        valueFontSize={height * 0.012}
        copyButton
      />
      <TableCell
        title="TX ID"
        value={cryptoTxId}
        valueFontSize={height * 0.012}
        copyButton
      />
      <TableCell title="DATE" value={createdAt} />
      <TableCell title="NETWORK FEE" value={`${fiatSymbol}${blockchainFee}`} />
      <TableCell
        title="PROVIDER FEE"
        value={`${fiatSymbol}${tipLFFee + moonpayFee}`}
      />
      {/* <TableCell title="PAID WITH" value={paymentMethod} /> */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomBtns}>
          <View style={styles.flexBtn1}>
            <BlueButton
              value="Blockchain"
              onPress={() => {
                navigation.navigate('WebPage', {
                  uri: currentExplorer,
                });
              }}
            />
          </View>
          <View style={styles.flexBtn2}>
            <GreenButton
              value="Details"
              onPress={() => {
                navigation.navigate('WebPage', {
                  uri: txDetailsUrl,
                });
              }}
            />
          </View>
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const SendReceiveLayout: React.FC<SendReceiveLayoutProps> = props => {
  const {
    fromAddress,
    fromAddressSize,
    toAddress,
    toAddressSize,
    blockchainFee,
    dateString,
    amountSymbol,
    currentExplorer,
  } = props;

  const navigation = useNavigation<any>();

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return (
    <Fragment>
      <View style={styles.fromToContainer}>
        <View style={styles.fromContainer}>
          <View style={styles.fromAndToIconContainer}>
            <View style={styles.fromAndToIcon} />
            <View style={styles.sentLine} />
          </View>
          <View style={styles.fromAndToTitlesContainer}>
            <Text style={styles.fromAndToTitle}>From</Text>
            <Text
              style={{
                ...styles.fromAddressTitle,
                fontSize: fromAddressSize,
              }}>
              {fromAddress}
            </Text>
          </View>
        </View>
        <View style={styles.toContainer}>
          <View style={styles.fromAndToIconContainer}>
            <View style={styles.fromAndToIcon} />
          </View>
          <View style={styles.fromAndToTitlesContainer}>
            <Text style={styles.fromAndToTitle}>To</Text>
            <Text
              style={{
                ...styles.toAddressTitle,
                fontSize: toAddressSize,
              }}>
              {toAddress}
            </Text>
          </View>
        </View>
      </View>
      <TableCell title="TIME & DATE" value={dateString} />
      <TableCell
        title="NETWORK FEE"
        value={`${blockchainFee}${amountSymbol}`}
      />
      <View style={styles.bottomContainer}>
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
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      height: '100%',
      width: '100%',
    },
    body: {
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: 'white',
      overflow: 'hidden',
    },
    fakeCardLeft: {
      position: 'absolute',
      bottom: 0,
      right: '100%',
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: '#fff',
      zIndex: 1,
    },
    fakeCardRight: {
      position: 'absolute',
      bottom: 0,
      left: '100%',
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: '#fff',
      zIndex: 1,
    },
    pagination: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: screenHeight * 0.06,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      zIndex: 2,
    },
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    paginationBullets: {
      height: '100%',
      width: '50%',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    bulletTouchContainer: {
      height: screenHeight * 0.06,
      width: screenHeight * 0.04,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    bullet: {
      height: screenHeight * 0.02,
      width: screenHeight * 0.02,
      borderRadius: screenHeight * 0.01,
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
      paddingLeft: screenHeight * 0.025,
      paddingRight: screenHeight * 0.025,
      paddingTop: screenHeight * 0.025,
      paddingBottom: screenHeight * 0.025,
    },
    modalHeaderTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.028,
      fontWeight: '600',
      flexDirection: 'row',
    },
    modalHeaderSubtitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.03,
      fontWeight: '600',
    },
    modalContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    statusText: {
      width: '100%',
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontSize: screenHeight * 0.015,
      fontWeight: '600',
      textTransform: 'uppercase',
      textAlign: 'center',
      paddingTop: screenHeight * 0.04,
      paddingBottom: screenHeight * 0.015,
    },
    fromToContainer: {
      height: screenHeight * 0.3,
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      padding: screenHeight * 0.03,
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
      marginRight: screenHeight * 0.03,
    },
    fromAndToIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
      borderRadius: screenHeight * 0.012,
      overflow: 'hidden',
    },
    sentLine: {
      flex: 1,
      width: 1,
      backgroundColor: '#ccc',
      margin: screenHeight * 0.01,
    },
    fromAndToTitlesContainer: {
      height: '100%',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    fromAndToTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.02,
      fontWeight: '600',
    },
    fromAddressTitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.025,
      fontWeight: '600',
    },
    toAddressTitle: {
      color: '#1ebc73',
      fontSize: screenHeight * 0.025,
      fontWeight: '600',
    },
    bottomContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      padding: screenHeight * 0.03,
    },
    bottomBtns: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: screenHeight * 0.03,
    },
    flexBtn1: {
      flexBasis: '55%',
    },
    flexBtn2: {
      flexBasis: '42%',
    },
    ltcNumColor: {
      color: '#2c72ff',
    },
  });
