import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import React from 'react';

import {useAppSelector} from '../../store/hooks';
import {subunitSelector, subunitSymbolSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';

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
  const {time, amount, sent} = item;

  const name = sent ? 'Sent Litecoin' : 'Received Litecoin';

  const convertToSubunit = useAppSelector(state => subunitSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const cryptoAmount = convertToSubunit(amount);
  const fiatAmount = calculateFiatAmount(amount);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle} />
      <View style={styles.left}>
        <Text style={styles.labelText}>{name}</Text>
        <Text style={styles.timeText}>{String(time)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.cryptoText}>
          {cryptoAmount}
          {amountSymbol}
        </Text>
        <Text style={styles.fiatText}>+{fiatAmount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 70,
    width: Dimensions.get('window').width,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingHorizontal: 19,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
  },
  left: {
    flexGrow: 1,
    paddingLeft: 12,
  },
  right: {
    // flexGrow: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 32 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  labelText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  timeText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
    paddingTop: 2,
  },
  cryptoText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#212124',
    fontSize: 14,
    textAlign: 'right',
  },
  fiatText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
    textAlign: 'right',
  },
  image: {
    alignSelf: 'center',
  },
});

export default TransactionCell;
