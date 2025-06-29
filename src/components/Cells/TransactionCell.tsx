import React, {useContext} from 'react';
import {StyleSheet, View, TouchableOpacity, Image} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import {useAppSelector} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  currencySymbolSelector,
} from '../../reducers/settings';
import {convertLocalFiatToUSD} from '../../reducers/ticker';
import {DisplayedMetadataType} from '../../utils/txMetadata';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  item: {
    time: Date;
    amount: number;
    label: string;
    metaLabel: string;
    priceOnDate: number;
    confs: number;
    providerMeta: DisplayedMetadataType;
  };
  onPress(): void;
}

const TransactionCell: React.FC<Props> = props => {
  const {item, onPress} = props;

  const {time, amount, label, metaLabel, priceOnDate, confs, providerMeta} =
    item;

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
            textKey: providerMeta?.status
              ? providerMeta.status === 'pending'
                ? 'buying_ltc'
                : 'bought_ltc'
              : 'bought_ltc',
            txIcon: require('../../assets/icons/buytx.png'),
            amountColor: '#1162E6',
          };
        case 'Sell':
          return {
            textKey: providerMeta?.status
              ? providerMeta.status === 'pending'
                ? 'selling_ltc'
                : 'sold_ltc'
              : 'sold_ltc',
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
    confs,
  );

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const cryptoAmount = convertToSubunit(amount);
  let cryptoAmountFormatted = cryptoAmount.toFixed(8);
  if (cryptoAmountFormatted.match(/\./)) {
    cryptoAmountFormatted = cryptoAmountFormatted.replace(/\.?0+$/, '');
  }
  // const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  // const fiatAmount = calculateFiatAmount(amount);

  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));
  const priceOnDateInLocalFiat = priceOnDate / localFiatToUSD;
  const amountInFiatOnDate = parseFloat(
    String(priceOnDateInLocalFiat * (amount / 100000000)),
  ).toFixed(2);
  const amountInFiatOnDateAbsVal = Math.abs(Number(amountInFiatOnDate));

  function calcStrokeProgress(radius: number): number {
    const circumference = 2 * Math.PI * radius;
    const syncedConfs = confs <= 0 ? 0 : confs;
    const progress = syncedConfs >= 6 ? 1 : syncedConfs / 6;
    const dashffset = circumference * (1 - progress);
    return dashffset;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <Image source={txIcon} />
        </View>
        {confs > 6 ? (
          <></>
        ) : (
          <Svg
            height={styles.circleContainer.height}
            width={styles.circleContainer.width}
            style={styles.circleProgress}>
            <Circle
              rotation={-90}
              originX={(styles.circleContainer.width - 6) / 2 + 3}
              originY={(styles.circleContainer.height - 6) / 2 + 3}
              cx={(styles.circleContainer.width - 6) / 2 + 3}
              cy={(styles.circleContainer.height - 6) / 2 + 3}
              r={(styles.circleContainer.width - 6) / 2}
              stroke="#1EBC73"
              strokeWidth={SCREEN_HEIGHT * 0.003}
              fill="transparent"
              strokeDasharray={Math.PI * (styles.circleContainer.width - 6)}
              strokeDashoffset={calcStrokeProgress(
                (styles.circleContainer.width - 6) / 2,
              )}
            />
          </Svg>
        )}
      </View>
      <View style={styles.left}>
        <TranslateText
          textKey={textKey}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.textKeyText}
          numberOfLines={1}
        />
        <View style={styles.timeContainer}>
          <TranslateText
            textValue={String(time)}
            domain={'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.timeText}
            numberOfLines={1}
          />
          <TranslateText
            textValue={label}
            domain={'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.labelText}
            numberOfLines={1}
          />
        </View>
      </View>
      <View style={styles.right}>
        <TranslateText
          textKey={`${cryptoAmountFormatted}${amountSymbol}`}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.cryptoText}
          numberOfLines={1}
        />
        <TranslateText
          textKey={`${mathSign}${currencySymbol}${amountInFiatOnDateAbsVal}`}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.fiatText}
          numberOfLines={1}
        />
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  sent: boolean,
  amountColor: string,
  confs: number,
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
    circleContainer: {
      minWidth: 24,
      minHeight: 24,
      width: screenHeight * 0.045,
      height: screenHeight * 0.045,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    circle: {
      width: confs > 6 ? '80%' : '67%',
      height: confs > 6 ? '80%' : '67%',
      borderRadius: screenHeight * 0.04 <= 24 ? 12 : (screenHeight * 0.04) / 2,
      backgroundColor: sent ? '#000' : '#1162E6',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    circleProgress: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
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
