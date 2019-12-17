import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch} from 'react-redux';

import LinearGradient from 'react-native-linear-gradient';
import BlueButton from '../components/Buttons/BlueButton';
import AmountInput from '../components/AmountInput';
import GreyTextInput from '../components/GreyTextInput';
import {addInvoice} from '../reducers/invoice';

const LightningReceive = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();

  const [selected, select] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = () => {
    dispatch(addInvoice({amount, memo}));
    navigate('LightningInvoice');
  };

  return (
    <View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <AmountInput
        onChangeText={amount => setAmount(amount)}
        onAccept={() => select(false)}
        selected={() => select(true)}
      />

      {!selected ? (
        <View>
          <LinearGradient
            colors={['rgba(242,248,253,0.2)', 'rgba(210,225,239,0.2)']}
            style={styles.bottomContainer}>
            <View style={styles.descriptionContainer}>
              <Text style={styles.leftTitle}>ADD Description</Text>
              <GreyTextInput
                placeholder="placeholder"
                onChangeText={memo => setMemo(memo)}
              />
            </View>
            <View style={styles.buttonContainer}>
              <BlueButton value="Create Invoice" onPress={handleSubmit} />
            </View>
          </LinearGradient>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 30,
  },
  titleContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftTitle: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomContainer: {
    height: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
  },
});

export default LightningReceive;
