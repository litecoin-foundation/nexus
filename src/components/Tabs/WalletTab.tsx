import React from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import PriceIndicatorButton from '../Buttons/PriceIndictorButton';

interface Props {
  colorStyle: string;
  walletName: string;
  balance: number;
  fiatBalance: number;
  priceRate: number;
  prevRate: number;
}

export default function WalletTab(props: Props) {
  const {colorStyle, walletName, balance, fiatBalance, priceRate, prevRate} =
    props;

  let isWhiteStyle = true;
  switch (colorStyle) {
    case 'White':
      isWhiteStyle = true;
      break;
    case 'Blue':
      isWhiteStyle = false;
      break;
    default:
      break;
  }

  const styles = StyleSheet.create({
    walletTab: {
      height: Dimensions.get('screen').height * 0.14,
      minHeight: 100,
      width: '100%',
      borderRadius: Dimensions.get('screen').height * 0.02,
      backgroundColor: isWhiteStyle ? '#fff' : '#193A72',
      flexDirection: 'row',
      alignItems: 'center',
      padding: Dimensions.get('screen').height * 0.015,
    },
    tabLeft: {
      flexBasis: '75%',
      height: '90%',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    tabLeftTitle: {
      color: isWhiteStyle ? '#555' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: Dimensions.get('screen').height * 0.018,
    },
    tabLeftBalance: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: Dimensions.get('screen').height * 0.04,
      marginTop: Dimensions.get('screen').height * 0.008 * -1,
    },
    tabLeftWorthContainer: {
      flexDirection: 'row',
      gap: Dimensions.get('screen').height * 0.012,
    },
    tabLeftWorth: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
    tabLeftWorthChange: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
    tabRight: {
      flexBasis: '25%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      borderRadius: Dimensions.get('screen').height * 0.016,
      backgroundColor: isWhiteStyle ? '#eee' : '#061A39',
    },
    tabRightCopyIcon: {
      height: Dimensions.get('screen').height * 0.035,
      width: Dimensions.get('screen').height * 0.035,
      backgroundColor: 'red',
    },
    tabRightTitle: {
      color: isWhiteStyle ? '#000' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.012,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginTop: Dimensions.get('screen').height * 0.01,
    },
  });

  const change: any = (priceRate / prevRate) * 100 - 100;
  const changeText =
    change < 0 ? '' : '+' + parseFloat(change).toFixed(2) + '%';

  return (
    <View style={styles.walletTab}>
      <View style={styles.tabLeft}>
        <Text style={styles.tabLeftTitle}>{walletName}</Text>
        <Text style={styles.tabLeftBalance}>{balance + ' LTC'}</Text>
        <View style={styles.tabLeftWorthContainer}>
          <Text style={styles.tabLeftWorth}>{fiatBalance}</Text>
          <PriceIndicatorButton value={Number(change)} />
          <Text style={styles.tabLeftWorthChange}>{changeText}</Text>
        </View>
      </View>
      <View style={styles.tabRight}>
        <View style={styles.tabRightCopyIcon} />
        <Text style={styles.tabRightTitle}>copy address</Text>
      </View>
    </View>
  );
}
