import React, {useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';

import {useAppSelector} from '../../store/hooks';
import {subunitSelector, subunitSymbolSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  item: {
    time: Date;
    amount: number;
    sent: boolean;
  };
  onPress(): void;
}

const TransactionCell: React.FC<Props> = props => {
  const {item, onPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {time, amount, sent} = item;

  const name = sent ? 'Sent Litecoin' : 'Received Litecoin';

  const convertToSubunit = useAppSelector(state => subunitSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const cryptoAmount = convertToSubunit(amount);
  const fiatAmount = calculateFiatAmount(amount);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[styles.circle, !sent ? {backgroundColor: '#1162E6'} : null]}>
        <Image
          source={
            sent
              ? require('../../assets/icons/sendtx.png')
              : require('../../assets/icons/receivetx.png')
          }
        />
      </View>
      <View style={styles.left}>
        <Text style={styles.labelText}>{name}</Text>
        <Text style={styles.timeText}>{String(time)}</Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[styles.cryptoText, !sent ? styles.receivedCryptoText : null]}>
          {cryptoAmount}
          {amountSymbol}
        </Text>
        <Text style={styles.fiatText}>+{fiatAmount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
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
      flexGrow: 1,
      paddingLeft: screenWidth * 0.05,
    },
    right: {
    },
    circle: {
      minWidth: 24,
      minHeight: 24,
      width: screenHeight * 0.04,
      height: screenHeight * 0.04,
      borderRadius: screenHeight * 0.04 <= 24 ? 12 : (screenHeight * 0.04) / 2,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#484859',
      fontSize: screenHeight * 0.015,
    },
    timeText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#747E87',
      fontSize: screenHeight * 0.013,
      paddingTop: screenHeight * 0.004,
    },
    cryptoText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#212124',
      fontSize: screenHeight * 0.016,
      textAlign: 'right',
    },
    receivedCryptoText: {
      color: '#1162E6',
    },
    fiatText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#747E87',
      fontSize: screenHeight * 0.013,
      textAlign: 'right',
    },
    image: {
      alignSelf: 'center',
    },
  });

export default TransactionCell;
