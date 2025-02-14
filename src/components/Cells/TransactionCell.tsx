import React, {useContext} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';

import {useAppSelector} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  currencySymbolSelector,
} from '../../reducers/settings';
import {convertLocalFiatToUSD} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  item: {
    time: Date;
    amount: number;
    label: string;
    metaLabel: string;
    priceOnDateMeta: number;
  };
  onPress(): void;
}

const TransactionCell: React.FC<Props> = props => {
  const {item, onPress} = props;

  const {time, amount, label, metaLabel, priceOnDateMeta} = item;

  const mathSign = Math.sign(parseFloat(String(amount))) === -1 ? '-' : '';

  const {textKey, txIcon, amountColor} = {
    current: function () {
      switch (metaLabel) {
        case 'Send':
          return {
            textKey: 'sent_ltc',
            txIcon: require('../../assets/icons/sendtx.png'),
            amountColor: '#212124',
          };
        case 'Receive':
          return {
            textKey: 'received_ltc',
            txIcon: require('../../assets/icons/receivetx.png'),
            amountColor: '#1162E6',
          };
        case 'Buy':
          return {
            textKey: 'bought_ltc',
            txIcon: require('../../assets/icons/buytx.png'),
            amountColor: '#1162E6',
          };
        case 'Sell':
          return {
            textKey: 'sent_ltc',
            txIcon: require('../../assets/icons/selltx.png'),
            amountColor: '#212124',
          };
        default:
          return {
            textKey: 'Unknown Status',
            txIcon: null,
            amountColor: '#212124',
          };
      }
    },
  }.current();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    metaLabel === 'Send',
    amountColor,
  );

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const cryptoAmount = convertToSubunit(amount);
  // const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  // const fiatAmount = calculateFiatAmount(amount);

  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));
  const priceOnDateInLocalFiat = priceOnDateMeta / localFiatToUSD;
  const amountInFiatOnDate = parseFloat(
    String(priceOnDateInLocalFiat * (amount / 100000000)),
  ).toFixed(2);
  const amountInFiatOnDateAbsVal = Math.abs(Number(amountInFiatOnDate));

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle}>
        <Image source={txIcon} />
      </View>
      <View style={styles.left}>
        <TranslateText
          textKey={textKey}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={styles.textKeyText}
          numberOfLines={1}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{String(time)}</Text>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.cryptoText}>
          {cryptoAmount}
          {amountSymbol}
        </Text>
        <Text style={styles.fiatText}>
          {`${mathSign}${currencySymbol}${amountInFiatOnDateAbsVal}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  sent: boolean,
  amountColor: string,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: screenWidth,
      height: screenHeight * 0.08,
      minHeight: 50,
      backgroundColor: '#ffffff',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.05,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(214, 216, 218, 0.3)',
    },
    left: {
      flex: 1,
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingVertical: screenHeight * 0.02,
      paddingLeft: screenWidth * 0.05,
    },
    right: {
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingVertical: screenHeight * 0.02,
    },
    circle: {
      minWidth: 24,
      minHeight: 24,
      width: screenHeight * 0.04,
      height: screenHeight * 0.04,
      borderRadius: screenHeight * 0.04 <= 24 ? 12 : (screenHeight * 0.04) / 2,
      backgroundColor: sent ? '#000' : '#1162E6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textKeyText: {
      color: '#484859',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.19,
      flexDirection: 'column',
    },
    timeContainer: {
      flexDirection: 'row',
    },
    timeText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
      paddingTop: screenHeight * 0.004,
    },
    labelText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
      paddingTop: screenHeight * 0.004,
      marginLeft: screenWidth * 0.02,
    },
    cryptoText: {
      color: amountColor,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.016,
      textAlign: 'right',
      letterSpacing: -0.19,
    },
    fiatText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      textAlign: 'right',
      letterSpacing: -0.28,
    },
    image: {
      alignSelf: 'center',
    },
  });

export default TransactionCell;
