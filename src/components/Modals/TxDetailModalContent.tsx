import React, {useEffect, useCallback, useContext, Fragment} from 'react';
import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {v4 as uuidv4} from 'uuid';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import {formatTxDate} from '../../utils/date';
import {isConvertMetadata, isBuySellMetadata} from '../../utils/txMetadata';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {IDisplayedTx, labelTransaction} from '../../reducers/transaction';
import {
  getTxTitleMeta,
  useTxExplorerUrl,
  useTxSenderAndFee,
} from './useTxDetailData';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  getCurrencySymbol,
  currencySymbolSelector,
} from '../../reducers/settings';
import {convertLocalFiatToUSD} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

import SendReceiveTxLayout from '../Layouts/SendReceiveTxLayout.tsx';
import SellBuyTxLayout from '../Layouts/SellBuyTxLayout.tsx';
import ConvertTxLayout from '../Layouts/ConvertTxLayout.tsx';

interface Props {
  close: () => void;
  transaction: IDisplayedTx;
  setTransactionIndex: (txIndex: number) => void;
  cardTranslateAnim: any;
  cardOpacityAnim: any;
  prevNextCardOpacityAnim: any;
  paginationOpacityAnim: any;
  txsNum?: number;
}

export default function TxDetailModalContent(props: Props) {
  const {
    close,
    transaction,
    setTransactionIndex,
    cardTranslateAnim,
    cardOpacityAnim,
    prevNextCardOpacityAnim,
    paginationOpacityAnim,
    txsNum,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const {textKey} = getTxTitleMeta(transaction);
  const currentExplorer = useTxExplorerUrl(transaction);

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const cryptoAmount = convertToSubunit(transaction.amount);
  let cryptoAmountFormatted = cryptoAmount.toString();
  if (cryptoAmountFormatted.match(/\./)) {
    cryptoAmountFormatted = cryptoAmountFormatted.replace(/\.?0+$/, '');
  }
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const dateString = formatTxDate(transaction.timestamp);
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));
  const priceOnDateInLocalFiat = transaction.priceOnDate / localFiatToUSD;
  const amountInFiatOnDate = parseFloat(
    String(priceOnDateInLocalFiat * (transaction.amount / 100000000)),
  ).toFixed(2);
  const amountInFiatOnDateAbsVal = Math.abs(Number(amountInFiatOnDate)).toFixed(
    2,
  );

  const {allInputAddrs, fetchedTxFee} = useTxSenderAndFee(transaction);

  const myOutputs = transaction.myOutputs || [];
  const otherOutputs = transaction.otherOutputs || [];

  const fadeNewDetailsOpacity = useSharedValue(1);
  const fadeNewDetailsIn = useAnimatedStyle(() => {
    return {
      opacity: fadeNewDetailsOpacity.value,
    };
  });

  useEffect(() => {
    fadeNewDetailsOpacity.value = 0;
    fadeNewDetailsOpacity.value = withTiming(1, {duration: 500});
  }, [transaction, fadeNewDetailsOpacity]);

  const activeBulletNum = transaction.renderIndex + 1;

  const RenderPagination = useCallback(() => {
    const buttons: any = [];
    const maxBulletsNum = 5;

    if (txsNum && txsNum > 0) {
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
    }

    return buttons;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBulletNum]);

  const {
    fiatSymbol,
    providerTxId,
    cryptoTxId,
    createdAt,
    // fiatCurrency,
    fiatCurrencyAmount,
    cryptoCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    providerFee,
    txDetailsUrl,
    status,
    // paymentMethod,
  } = {
    current: function () {
      let fiatSymbolProp = '';
      let providerTxIdProp = '';
      let cryptoTxIdProp = '';
      let createdAtProp = '';
      let fiatCurrencyAmountProp = 0;
      let cryptoCurrencyAmountProp = 0;
      let totalFeeProp: number | 'unknown' = 0;
      let blockchainFeeProp: number | 'unknown' = 0;
      let tipLFFeeProp: number | 'unknown' = 0;
      let providerFeeProp: number | 'unknown' = 0;
      let txDetailsUrlProp = '';
      let statusProp = '';
      // let paymentMethodProp = '';

      if (isBuySellMetadata(transaction.providerMeta)) {
        fiatSymbolProp = transaction.providerMeta.fiatCurrency
          ? getCurrencySymbol(transaction.providerMeta.fiatCurrency)
          : '$';
        providerTxIdProp = transaction.providerMeta.providerTxId;
        cryptoTxIdProp = transaction.providerMeta.cryptoTxId;
        createdAtProp = formatTxDate(
          parseInt(
            String(Date.parse(transaction.providerMeta.createdAt) / 1000),
            10,
          ),
        );
        fiatCurrencyAmountProp = transaction.providerMeta.fiatCurrencyAmount;
        cryptoCurrencyAmountProp =
          transaction.providerMeta.cryptoCurrencyAmount;
        totalFeeProp = transaction.providerMeta.totalFee;
        blockchainFeeProp = transaction.providerMeta.blockchainFee;
        tipLFFeeProp = transaction.providerMeta.tipLFFee;
        providerFeeProp = transaction.providerMeta.providerFee;
        txDetailsUrlProp = transaction.providerMeta.txDetailsUrl;
        statusProp = transaction.providerMeta.status;
        // paymentMethodProp = transaction.providerMeta.paymentMethod;
      } else {
        // NOTE: fetching fee data from explorer due to incorrect response from lnd
        // totalFeeProp = transaction.fee;
        // blockchainFeeProp = transaction.fee;
        totalFeeProp = fetchedTxFee || 'unknown';
        blockchainFeeProp = fetchedTxFee || 'unknown';
      }

      return {
        fiatSymbol: fiatSymbolProp,
        providerTxId: providerTxIdProp,
        cryptoTxId: cryptoTxIdProp,
        createdAt: createdAtProp,
        fiatCurrencyAmount: fiatCurrencyAmountProp,
        cryptoCurrencyAmount: cryptoCurrencyAmountProp,
        totalFee: totalFeeProp,
        blockchainFee: blockchainFeeProp,
        tipLFFee: tipLFFeeProp,
        providerFee: providerFeeProp,
        txDetailsUrl: txDetailsUrlProp,
        status: statusProp,
        // paymentMethod: paymentMethodProp,
      };
    },
  }.current();

  function labelTx(labelProp: string) {
    if (transaction.label !== labelProp) {
      dispatch(labelTransaction(transaction.hash, labelProp));
    }
  }

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
              <View style={styles.modalHeaderTitlesContainer}>
                <TranslateText
                  textKey={textKey}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.027}
                  textStyle={styles.modalHeaderTitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={' '}
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.027}
                  textStyle={styles.modalHeaderTitle}
                  numberOfLines={1}
                />
                <TranslateText
                  textValue={
                    `${cryptoAmountFormatted}${amountSymbol}` +
                    ` (${currencySymbol}${amountInFiatOnDateAbsVal})`
                  }
                  domain={'main'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.027}
                  textStyle={styles.modalHeaderSubtitle}
                  numberOfLines={1}
                />
              </View>
              <GreyRoundButton onPress={() => close()} />
            </View>
            <View style={styles.modalContentContainer}>
              {transaction.metaLabel === 'Send' ||
              transaction.metaLabel === 'Receive' ? (
                <SendReceiveTxLayout
                  isSend={transaction.metaLabel === 'Send'}
                  isMweb={transaction.isMweb}
                  allInputAddrs={allInputAddrs}
                  myOutputAddrs={myOutputs}
                  otherOutputAddrs={otherOutputs}
                  txId={transaction.hash}
                  label={transaction.label || ''}
                  dateString={dateString}
                  amountSymbol={amountSymbol}
                  currentExplorer={currentExplorer}
                  blockchainFee={blockchainFee}
                  labelTx={labelTx}
                />
              ) : transaction.metaLabel === 'Convert' &&
                isConvertMetadata(transaction.providerMeta) ? (
                <ConvertTxLayout
                  conversionType={transaction.providerMeta.conversionType}
                  destinationAddress={
                    transaction.providerMeta.destinationAddress
                  }
                  targetAmount={transaction.providerMeta.targetAmount}
                  selectedUtxos={transaction.providerMeta.selectedUtxos}
                  myOutputAddrs={myOutputs}
                  otherOutputAddrs={otherOutputs}
                  outputDetails={
                    transaction.providerMeta.mergedOutputDetails || []
                  }
                  txId={transaction.hash}
                  dateString={dateString}
                  amountSymbol={amountSymbol}
                  currentExplorer={currentExplorer}
                  blockchainFee={blockchainFee}
                />
              ) : (
                <SellBuyTxLayout
                  isSell={transaction.metaLabel === 'Sell'}
                  fiatSymbol={fiatSymbol}
                  ltcSymbol={'Ł'}
                  providerTxId={providerTxId}
                  cryptoTxId={cryptoTxId}
                  createdAt={createdAt}
                  fiatCurrencyAmount={fiatCurrencyAmount}
                  cryptoCurrencyAmount={cryptoCurrencyAmount}
                  totalFee={totalFee}
                  blockchainFee={blockchainFee}
                  tipLFFee={tipLFFee}
                  providerFee={providerFee}
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
      height: screenHeight * 0.04,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      zIndex: 2,
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
      width: '100%',
      backgroundColor: '#f7f7f7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.015,
      paddingHorizontal: screenHeight * 0.025,
    },
    modalHeaderTitlesContainer: {
      flexBasis: '80%',
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    modalHeaderTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
      flexDirection: 'row',
      fontFamily: 'Satoshi Variable',
    },
    modalHeaderSubtitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    modalContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
  });
