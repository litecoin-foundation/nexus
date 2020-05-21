import React, {useState, Fragment} from 'react';
import {View, Text, StyleSheet} from 'react-native';
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

  const [selected, select] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isInvoiceModalTriggered, triggerInvoiceModal] = useState(false);

  const handleSubmit = () => {
    dispatch(addInvoice({amount, memo}));
    triggerInvoiceModal(true);
  };

  return (
    <Fragment>
      <Header />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE AMOUNT</Text>
      </View>
      <AmountInput
        onChangeText={(amount) => setAmount(amount)}
        onAccept={() => select(false)}
        selected={() => select(true)}
        confirmButtonText="Create Invoice"
      />

      {!selected ? (
        <LinearGradient
          colors={['#F6F9FC', 'rgba(210,225,239,0)']}
          style={styles.bottomContainer}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.leftTitle}>ADD Description</Text>
            <InputField
              placeholder="Enter Note to Self"
              onChangeText={(memo) => setMemo(memo)}
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
    </Fragment>
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
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
  };
};

export default LightningReceive;
