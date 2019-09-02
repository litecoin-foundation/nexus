import React, {Fragment, useState} from 'react';
import {View, Text, Clipboard, StyleSheet, TextInput} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch} from 'react-redux';

import AmountInput from '../components/AmountInput';
import AddressField from '../components/AddressField';
import FeeModal from '../components/FeeModal';
import SendModal from '../components/SendModal';
import SquareButton from '../components/SquareButton';
import GreenRoundButton from '../components/GreenRoundButton';
import BlueButton from '../components/BlueButton';

import {inputParams, estimateOnchainFee} from '../reducers/payment';
import {decodeBIP21} from '../lib/utils/bip21';
import validateLtcAddress from '../lib/utils/validate';

const Send = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();

  const [isSendModalTriggered, triggerSendModal] = useState(false);
  const [isFeeModalTriggered, triggerFeeModal] = useState(false);
  const [isAmountInputTriggered, triggerAmountInput] = useState(false);
  const [address, setAddress] = useState(null);
  const [amount, setAmount] = useState(null);
  const [fee, setFee] = useState(0);

  const updateFees = () => {
    if (address === undefined || amount === undefined) {
      return;
    }
    dispatch(estimateOnchainFee(address, amount));
  };

  const handleScan = () => {
    navigate('Scanner');
  };

  const handlePaste = async () => {
    const address = await Clipboard.getString();

    // check if URI by decoding using the bip21 library
    try {
      const decoded = decodeBIP21(address);
      console.log(decoded);

      const validated = await validateLtcAddress(decoded.address);

      if (!validated) {
        alert('invalid address');
        console.log(address);
        return;
      }

      setAddress(decoded.address);
      setAmount(decoded.options.amount);
      await updateFees();
    } catch (error) {
      const validated = await validateLtcAddress(address);

      if (!validated) {
        alert('invalid address');
        console.log(address);
        return;
      }

      setAddress(validated.address);
      await updateFees();
    }
  };

  return (
    <Fragment>
      <View style={styles.amountHeaderContainer}>
        <Text style={styles.amountHeaderText}>CHOOSE AMOUNT</Text>
      </View>

      <AmountInput
        onChangeText={amount => setAmount(amount)}
        onAccept={() => triggerAmountInput(false)}
        selected={() => triggerAmountInput(true)}
      />
      <View>
        <View style={styles.typeTextContainer}>
          <Text style={styles.recipientHeaderText}>CHOOSE recipient</Text>
        </View>

        {address ? (
          <AddressField
            address={address}
            onPressClose={() => setAddress(null)}
          />
        ) : (
          <View style={styles.recipientContainer}>
            <SquareButton value="Paste" onPress={() => handlePaste()} />
            <SquareButton value="NFC" />
            <SquareButton value="Scan" onPress={handleScan} />
          </View>
        )}
      </View>

      <View style={styles.recipientHeaderContainer}>
        <Text style={styles.descriptionHeaderText}>ADD Description</Text>
        <View style={styles.descriptionContainer}>
          <TextInput placeholder="description" />
        </View>
        <View style={styles.feeContainer}>
          <Text style={styles.feeHeaderText}>FEE</Text>
          <GreenRoundButton
            onPress={() => triggerFeeModal(true)}
            value={fee}
            disabled
          />
        </View>
      </View>

      {isAmountInputTriggered ? null : (
        <View style={styles.sendContainer}>
          <BlueButton
            value="Create Invoice"
            onPress={() => triggerSendModal(true)}
          />
        </View>
      )}

      <FeeModal
        isVisible={isFeeModalTriggered}
        close={() => triggerFeeModal(false)}
      />
      <SendModal
        isVisible={isSendModalTriggered}
        close={() => triggerSendModal(false)}
      />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  recipientContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
    paddingBottom: 105,
  },
  amountHeaderContainer: {
    height: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountHeaderText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  recipientHeaderContainer: {
    marginLeft: 20,
    paddingRight: 20,
  },
  recipientHeaderText: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionHeaderText: {
    paddingTop: 20,
    paddingBottom: 20,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginLeft: 0,
    paddingLeft: 20,
    height: 50,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  feeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  feeHeaderText: {
    height: 22,
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  sendContainer: {
    height: 100,
    width: '100%',
    bottom: 0,
    position: 'absolute',
    alignItems: 'center',
  },
  typeTextContainer: {
    marginLeft: 20,
  },
});

export default Send;
