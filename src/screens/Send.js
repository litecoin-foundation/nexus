import React, {Fragment, useState} from 'react';
import {View, Text, Clipboard, StyleSheet, TextInput} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import {useDispatch} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import AmountInput from '../components/AmountInput';
import AddressField from '../components/AddressField';
import SendModal from '../components/Modals/SendModal';
import SquareButton from '../components/Buttons/SquareButton';
import BlueButton from '../components/Buttons/BlueButton';
import AccountCell from '../components/Cells/AccountCell';
import ScanModal from '../components/Modals/ScanModal';

import {inputParams} from '../reducers/payment';
import {decodeBIP21} from '../lib/utils/bip21';
import validateLtcAddress from '../lib/utils/validate';
import {updateAmount} from '../reducers/input';

const Send = () => {
  const {navigate} = useNavigation();
  const dispatch = useDispatch();

  const [isSendModalTriggered, triggerSendModal] = useState(false);
  const [isScanModalTriggered, triggerScanModal] = useState(false);
  const [isAmountInputTriggered, triggerAmountInput] = useState(false);
  const [address, setAddress] = useState(null);
  const [amount, setAmount] = useState(null);

  const validate = async data => {
    try {
      const decoded = decodeBIP21(data);
      const validated = await validateLtcAddress(decoded.address);

      if (!validated) {
        alert('invalid address');
        return;
      }

      setAmount(decoded.options.amount);
      setAddress(decoded.address);
      dispatch(updateAmount(toString(decoded.options.amount)));
    } catch (error) {
      const validated = await validateLtcAddress(data);

      if (!validated) {
        alert('invalid address');
        return;
      }
      setAddress(validated.address);
    }
  };

  const handleScan = () => {
    triggerScanModal(true);
  };

  const handlePaste = async () => {
    const clipboard = await Clipboard.getString();
    validate(clipboard);
  };

  return (
    <Fragment>
      <LinearGradient
        colors={['#7E58FF', '#2C44C8']}
        style={styles.headerContainer}>
        <Text style={styles.headerText}>From Wallet</Text>

        <AccountCell
          onPress={() => console.log('nothing')}
          syncStatusDisabled={true}
        />
      </LinearGradient>
      <View style={styles.amountHeaderContainer}>
        <Text style={styles.amountHeaderText}>CHOOSE AMOUNT</Text>
      </View>

      <AmountInput
        onChangeText={input => setAmount(input)}
        onAccept={() => triggerAmountInput(false)}
        selected={() => triggerAmountInput(true)}
        confirmButtonText="Confirm"
      />

      <LinearGradient
        colors={['#F6F9FC', 'rgba(210,225,239,0)']}
        style={styles.flex}>
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
              <SquareButton
                imageSource={require('../assets/images/paste.png')}
                value="Paste"
                onPress={() => handlePaste()}
              />
              <SquareButton
                imageSource={require('../assets/images/nfc.png')}
                value="NFC"
              />
              <SquareButton
                imageSource={require('../assets/images/qrcode.png')}
                value="Scan"
                onPress={handleScan}
              />
            </View>
          )}
        </View>

        <View style={styles.recipientHeaderContainer}>
          <Text style={styles.descriptionHeaderText}>ADD Description</Text>
          <View style={styles.descriptionContainer}>
            <TextInput
              placeholder="description"
              style={styles.descriptionText}
            />
          </View>
        </View>
      </LinearGradient>

      {isAmountInputTriggered ? null : (
        <View style={styles.sendContainer}>
          <BlueButton value="Send" onPress={() => triggerSendModal(true)} />
        </View>
      )}

      <SendModal
        isVisible={isSendModalTriggered}
        close={() => triggerSendModal(false)}
      />

      <ScanModal
        isVisible={isScanModalTriggered}
        close={() => triggerScanModal(false)}
        handleQRRead={data => {
          validate(data);
          triggerScanModal(false);
        }}
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
    shadowColor: 'rgba(82,84,103,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {
      height: 6,
      width: 0,
    },
  },
  descriptionText: {
    color: 'rgba(74, 74, 74, 1)',
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
  headerContainer: {
    height: 200,
    justifyContent: 'center',
    borderWidth: 1,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#C4C4F9',
    fontSize: 11,
    fontWeight: 'bold',
  },
  flex: {
    flex: 1,
  },
});

Send.navigationOptions = () => {
  return {
    headerTitle: 'Send',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };
};

export default Send;
