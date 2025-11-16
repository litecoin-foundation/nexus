import React, {useContext, Fragment} from 'react';
import {View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import GreenButton from '../Buttons/GreenButton';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface SellBuyLayoutProps {
  isSell: boolean;
  fiatSymbol: string;
  ltcSymbol: string;
  providerTxId: string;
  cryptoTxId: string;
  createdAt: string;
  // updatedAt: string;
  // walletAddress: string;
  fiatCurrencyAmount: number;
  cryptoCurrencyAmount: number;
  // usdRate: number;
  // eurRate: number;
  // gbpRate: number;
  totalFee: number | 'unknown';
  blockchainFee: number | 'unknown';
  tipLFFee: number | 'unknown';
  providerFee: number | 'unknown';
  txDetailsUrl: string;
  status: string;
  // country: string;
  // paymentMethod: string;
  currentExplorer: string;
}

const SellBuyTxLayout: React.FC<SellBuyLayoutProps> = props => {
  const {
    isSell,
    fiatSymbol,
    ltcSymbol,
    providerTxId,
    cryptoTxId,
    createdAt,
    fiatCurrencyAmount,
    cryptoCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    providerFee,
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
      <View style={styles.topContainer}>
        {/* <Text style={styles.statusText}>{status}</Text> */}
        <TableCell
          titleTextKey="total"
          titleTextDomain="main"
          value={
            isSell
              ? `${cryptoCurrencyAmount}${ltcSymbol} (${fiatSymbol}${fiatCurrencyAmount})`
              : `${fiatSymbol}${fiatCurrencyAmount}`
          }
          blueValue
          thick
        />
        {isSell ? (
          <TableCell
            titleTextKey="rate"
            titleTextDomain="buyTab"
            value={`${fiatSymbol}${parseFloat(
              String(fiatCurrencyAmount / cryptoCurrencyAmount),
            ).toFixed(2)}`}
            blueValue
            thick
          />
        ) : (
          <></>
        )}

        <View style={styles.tableCell}>
          <View style={styles.tableCellRow}>
            <TranslateText
              textKey={'total_fee'}
              domain={'main'}
              maxSizeInPixels={height * 0.017}
              textStyle={styles.tableCellTitle}
              numberOfLines={1}
            />
            <TranslateText
              textValue={`${fiatSymbol}${totalFee}`}
              maxSizeInPixels={height * 0.02}
              textStyle={styles.tableCellValue}
              numberOfLines={1}
            />
          </View>
          <View style={styles.tableCellRow}>
            <View style={styles.tableCellSubRow}>
              <View style={styles.tableCellListDot} />
              <TranslateText
                textKey={'network_fee'}
                domain={'main'}
                maxSizeInPixels={height * 0.017}
                textStyle={styles.tableCellTitle}
                numberOfLines={1}
              />
            </View>
            <TranslateText
              textValue={
                blockchainFee !== 'unknown'
                  ? `${fiatSymbol}${blockchainFee}`
                  : 'unknown'
              }
              maxSizeInPixels={height * 0.02}
              textStyle={styles.tableCellSubValue}
              numberOfLines={1}
            />
          </View>
          <View style={styles.tableCellRow}>
            <View style={styles.tableCellSubRow}>
              <View style={styles.tableCellListDot} />
              <TranslateText
                textKey={'provider_fee'}
                domain={'main'}
                maxSizeInPixels={height * 0.017}
                textStyle={styles.tableCellTitle}
                numberOfLines={1}
              />
            </View>
            <TranslateText
              textValue={
                tipLFFee !== 'unknown' && providerFee !== 'unknown'
                  ? `${fiatSymbol}${Number(tipLFFee) + Number(providerFee)}`
                  : 'unknown'
              }
              maxSizeInPixels={height * 0.02}
              textStyle={styles.tableCellSubValue}
              numberOfLines={1}
            />
          </View>
        </View>
        <TableCell
          titleTextKey="moonpay_id"
          titleTextDomain="main"
          value={providerTxId}
          thick
          valueFontSize={height * 0.012}
          copyable
        />
        <TableCell
          titleTextKey="tx_id"
          titleTextDomain="main"
          value={
            status === 'completed' || status === 'sent'
              ? cryptoTxId
              : status === 'pending'
                ? 'Pending'
                : 'Unknown'
          }
          thick
          valueFontSize={height * 0.012}
          copyable
        />
        <TableCell
          titleTextKey="time_date"
          titleTextDomain="main"
          value={createdAt}
          thick
        />
      </View>
      <View style={styles.bottomContainer}>
        {status === 'completed' || status === 'sent' ? (
          <View style={styles.bottomBtns}>
            <View style={styles.flexBtn1}>
              <BlueButton
                textKey="blockchain"
                textDomain="main"
                onPress={() => {
                  navigation.navigate('WebPage', {
                    uri: currentExplorer,
                  });
                }}
              />
            </View>
            <View style={styles.flexBtn2}>
              <GreenButton
                textKey="details"
                textDomain="main"
                onPress={() => {
                  navigation.navigate('WebPage', {
                    uri: txDetailsUrl,
                  });
                }}
              />
            </View>
          </View>
        ) : status === 'pending' ? (
          <View style={styles.bottomBtns}>
            <View style={styles.flexBtn}>
              <GreenButton
                textKey="details"
                textDomain="main"
                onPress={() => {
                  navigation.navigate('WebPage', {
                    uri: txDetailsUrl,
                  });
                }}
              />
            </View>
          </View>
        ) : (
          <></>
        )}
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    tableCell: {
      width: '100%',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingHorizontal: screenWidth * 0.05,
      paddingVertical: screenHeight * 0.01,
    },
    tableCellRow: {
      height: screenHeight * 0.035,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tableCellSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tableCellListDot: {
      width: screenHeight * 0.005,
      height: screenHeight * 0.005,
      borderRadius: '50%',
      backgroundColor: '#747e87',
      margin: screenHeight * 0.01,
    },
    tableCellTitle: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
    },
    tableCellValue: {
      color: '#4A4A4A',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'right',
    },
    tableCellSubValue: {
      color: '#4A4A4A',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '500',
      fontStyle: 'normal',
      textAlign: 'right',
    },
    topContainer: {
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    bottomContainer: {
      flexDirection: 'column',
      paddingHorizontal: screenWidth * 0.05,
    },
    bottomBtns: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    flexBtn: {
      flexBasis: '100%',
    },
    flexBtn1: {
      flexBasis: '55%',
    },
    flexBtn2: {
      flexBasis: '42%',
    },
  });

export default SellBuyTxLayout;
