import React, {useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useDispatch} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../components/Header';
import BlueButton from '../components/Buttons/BlueButton';
import AmountInput from '../components/AmountInput';
import InvoiceModal from '../components/Modals/InvoiceModal';
import InputField from '../components/InputField';
import {addInvoice} from '../reducers/invoice';

const LightningReceive = () => {
  const dispatch = useDispatch();

  const [isAmountInputTriggered, triggerAmountInput] = useState(false);
  const [selected, select] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isInvoiceModalTriggered, triggerInvoiceModal] = useState(false);

  const handleSubmit = async () => {
    await dispatch(addInvoice({amount, memo}));
    triggerInvoiceModal(true);
  };

  return (
    <>
      <Header />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <View
        style={
          isAmountInputTriggered
            ? {
                height: Dimensions.get('window').height - 175,
              }
            : styles.amountsContainer
        }>
        <AmountInput
          onChangeText={value => setAmount(value)}
          onAccept={() => {
            select(false);
            triggerAmountInput(false);
          }}
          selected={() => {
            select(true);
            triggerAmountInput(true);
          }}
          confirmButtonText="Confirm"
        />
      </View>

      {!selected ? (
        <LinearGradient
          colors={['#F6F9FC', 'rgb(238,244,249)']}
          style={styles.bottomContainer}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.leftTitle}>ADD Description</Text>
            <InputField
              placeholder="Enter Note to Self"
              onChangeText={value => setMemo(value)}
            />
          </View>
          <View style={styles.buttonContainer}>
            <BlueButton value="Create Invoice" onPress={handleSubmit} />
          </View>
        </LinearGradient>
      ) : null}

      <InvoiceModal
        isVisible={isInvoiceModalTriggered}
        close={() => triggerInvoiceModal(false)}
      />
    </>
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
    flex: 1,
  },
  buttonContainer: {
    bottom: 0,
    position: 'absolute',
    alignSelf: 'center',
    height: 100,
  },
});

LightningReceive.navigationOptions = () => {
  return {
    headerTitle: 'Receive',
    headerBackTitleVisible: false,
  };
};

export default LightningReceive;
