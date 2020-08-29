import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';

import {subunitSelector, subunitSymbolSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';

const TransactionCell = (props) => {
  const {item, onPress} = props;
  const {name, time, amount, sent} = item;

  const convertToSubunit = useSelector((state) => subunitSelector(state));
  const cryptoAmount = convertToSubunit(amount);
  const amountSymbol = useSelector((state) => subunitSymbolSelector(state));

  const calculateFiatAmount = useSelector((state) => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(amount);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={sent ? ['#FF415E', '#FF9052'] : ['#7E58FF', '#0D59EA']}
        style={styles.circle}>
        <View style={styles.smallCircle}>
          <Image
            style={styles.image}
            source={
              sent
                ? require('../../assets/images/sent.png')
                : require('../../assets/images/received.png')
            }
          />
        </View>
      </LinearGradient>
      <View style={styles.left}>
        <Text style={styles.labelText}>{name}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.text,
            sent ? styles.negativeText : styles.positiveText,
          ]}>
          {cryptoAmount} {amountSymbol}
        </Text>
        <Text
          style={[
            styles.fiatText,
            sent ? styles.negativeFiatText : styles.positiveFiatText,
          ]}>
          +${fiatAmount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 70,
    width: Dimensions.get('window').width - 30,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 15,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    shadowOffset: {
      height: 3,
      width: 0,
    },
  },
  left: {
    flexGrow: 2,
  },
  right: {
    flexGrow: 2,
    paddingRight: 15,
  },
  circle: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    marginLeft: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCircle: {
    width: 30,
    height: 30,
    borderRadius: 30 / 2,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  labelText: {
    color: '#484859',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
  },
  timeText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.31,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
    textAlign: 'right',
  },
  fiatText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: -0.17,
    textAlign: 'right',
  },
  positiveText: {
    color: '#2C72FF',
  },
  negativeText: {
    color: '#FF4B5C',
  },
  positiveFiatText: {
    color: '#20BB74',
  },
  negativeFiatText: {
    color: '#484859',
  },
  image: {
    alignSelf: 'center',
  },
});

export default TransactionCell;
