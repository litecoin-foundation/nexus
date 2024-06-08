import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getQuote} from '../../reducers/buy';
import {getPaymentRate, pollPaymentRate} from '../../reducers/ticker';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {
  resetInputs,
  updateAmount,
  updateFiatAmount,
} from '../../reducers/input';

interface Props {}

const Receive: React.FC<Props> = () => {
  const dispatch = useAppDispatch();

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const paymentRate = useAppSelector(state => state.ticker.paymentRate);
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);

  const [leftToggled, toggleLeft] = useState(true);
  const [toggleLTC, setToggleLTC] = useState(true);

  useEffect(() => {
    dispatch(getQuote());
    dispatch(getPaymentRate('moonpay'));
  });

  useEffect(() => {
    dispatch(pollPaymentRate());
  }, [dispatch]);

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value));
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value));
    }
  };

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row'}}>
        <View style={{flexDirection: 'column'}}>
          <Text>Buy {amount === '' ? '0.00' : amount} LTC</Text>
          <Text>
            for {currencySymbol}
            {leftToggled
              ? paymentRate === ''
                ? '0.00'
                : parseFloat(paymentRate * amount).toFixed(2)
              : fiatAmount}
          </Text>
        </View>

        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity
            onPress={() => setToggleLTC(!toggleLTC)}
            style={{
              borderRadius: 10,
              backgroundColor: '#F3F3F3',
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text>x</Text>
          </TouchableOpacity>

          <View
            style={{
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
              backgroundColor: '#F3F3F3',
              width: 84,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text>x</Text>
          </View>
        </View>
      </View>

      <BuyPad
        onChange={(value: string) => onChange(value)}
        currentValue={leftToggled ? amount : fiatAmount}
      />

      <BlueButton
        disabled={false}
        value="Preview Buy"
        onPress={() => console.log('pressed preview buy')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    flexDirection: 'column',
    maxHeight: 680,
  },
});

export default Receive;
