import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import Clipboard from '@react-native-community/clipboard';

import AmountInput from '../components/AmountInput';
import AddressField from '../components/AddressField';
import SendModal from '../components/Modals/SendModal';
import PinModal from '../components/Modals/PinModal';
import SquareButton from '../components/Buttons/SquareButton';
import BlueButton from '../components/Buttons/BlueButton';
import AccountCell from '../components/Cells/AccountCell';
import ScanModal from '../components/Modals/ScanModal';
import InputField from '../components/InputField';

import {decodeBIP21} from '../lib/utils/bip21';
import validateLtcAddress from '../lib/utils/validate';
import {updateAmount} from '../reducers/input';
import WhiteButton from '../components/Buttons/WhiteButton';
import {sendOnchainPayment} from '../reducers/transaction';

const Send = ({navigation}) => {
  const dispatch = useDispatch();

  const confirmedBalance = useSelector(
    (state) => state.balance.confirmedBalance,
  );
  const [isSendModalTriggered, triggerSendModal] = useState(false);
  const [isScanModalTriggered, triggerScanModal] = useState(false);
  const [isPinModalTriggered, triggerPinModal] = useState(false);
  const [isAmountInputTriggered, triggerAmountInput] = useState(false);
  const [address, setAddress] = useState(null);
  const [amount, setAmount] = useState(null);
  const [memo, changeMemo] = useState('');
  const [invalidQR, setInvalidQR] = useState(false);
  const [invalidPaste, setInvalidPaste] = useState(false);
  const [isConfirmDisabled, disableConfirm] = useState(true);

  useEffect(() => {
    if (
      address === null ||
      address === undefined ||
      amount === null ||
      amount === undefined ||
      parseFloat((amount + '').replace('.', '')) === 0
    ) {
      disableConfirm(true);
    } else if (amount > confirmedBalance || amount === '0' || amount === 0) {
      disableConfirm(true);
    } else {
      disableConfirm(false);
    }
  }, [address, amount, confirmedBalance]);

  const validate = async (data) => {
    try {
      const decoded = decodeBIP21(data);
      const valid = await validateLtcAddress(decoded.address);

      if (!valid) {
        throw new Error('Invalid URI');
      } else {
        setAmount(decoded.options.amount);
        setAddress(decoded.address);
        if (decoded.options.message) {
          changeMemo(decoded.options.message);
        }
        dispatch(updateAmount(decoded.options.amount));
        return;
      }
    } catch (error) {
      const valid = await validateLtcAddress(data);

      if (!valid) {
        throw new Error('Invalid Address');
      } else {
        setAddress(valid.address);
        return;
      }
    }
  };

  const handleScan = () => {
    triggerScanModal(true);
  };

  const handlePaste = async () => {
    const clipboard = await Clipboard.getString();

    try {
      await validate(clipboard);
    } catch (error) {
      setInvalidPaste(true);
      return;
    }
  };

  const handleScanCallback = async (data) => {
    triggerScanModal(false);
    try {
      await validate(data);
    } catch (error) {
      setInvalidQR(true);
      return;
    }
  };

  const handleConfirm = async () => {
    triggerSendModal(false);
    // sleep for 350ms whilst send confirm modal closes
    // required due to react-native bug where multiple
    // modals cannot be open at the same time.
    // closing should take 300ms
    await new Promise((r) => setTimeout(r, 600));
    triggerPinModal(true);
  };

  const handleValidationSuccess = async () => {
    triggerPinModal(false);

    // TODO: handle subunit
    // we're multiplying amount by 100M to find
    // the value in sats
    const paymentreq = {
      addr: address,
      amount: parseFloat(amount) * 100000000,
      ...(memo !== '' && {label: memo}),
    };

    try {
      await dispatch(sendOnchainPayment(paymentreq));
      navigation.navigate('Sent', {amount, address});
    } catch (error) {
      navigation.navigate('Fail', {amount, error});
    }
  };

  const handleValidationFailure = () => {
    Alert.alert('Incorrect PIN', 'Try Again', [{text: 'OK'}], {
      cancelable: false,
    });
  };

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={['#7E58FF', '#2C44C8']}
        style={[
          styles.headerContainer,
          DeviceInfo.hasNotch() ? styles.notch : styles.noNotch,
        ]}>
        <Text style={styles.headerText}>From Wallet</Text>
        <AccountCell disabled={true} syncStatusDisabled={true} />
      </LinearGradient>

      {invalidPaste ? (
        <LinearGradient
          colors={['#FF415E', '#FF9052']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.invalidPasteContainer}>
          <View style={styles.invalidHeaderContainer}>
            <View style={styles.invalidHeaderTextContainer}>
              <Image source={require('../assets/images/block.png')} />
              <Text style={styles.invalidHeaderText}>Invalid Paste</Text>
            </View>
            <TouchableOpacity onPress={() => setInvalidPaste(false)}>
              <Image source={require('../assets/images/close-white.png')} />
            </TouchableOpacity>
          </View>
          <Text style={styles.invalidText}>
            We couldn't recognize a valid address in your Clipboard. Try copying
            and pasting the correct address instead.
          </Text>
        </LinearGradient>
      ) : invalidQR ? (
        <LinearGradient
          colors={['#FF415E', '#FF9052']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.invalidContainer}>
          <View style={styles.invalidHeaderContainer}>
            <View style={styles.invalidHeaderTextContainer}>
              <Image source={require('../assets/images/block.png')} />
              <Text style={styles.invalidHeaderText}>Invalid QR Code</Text>
            </View>
            <TouchableOpacity onPress={() => setInvalidQR(false)}>
              <Image source={require('../assets/images/close-white.png')} />
            </TouchableOpacity>
          </View>
          <Text style={styles.invalidText}>
            We couldn't recognize a valid address in the QR Code. Try scanning
            it again.
          </Text>
          <View style={styles.invalidButtonContainer}>
            <View style={styles.invlaidButtonSubcontainer}>
              <WhiteButton
                small={true}
                active={true}
                value="RESCAN"
                customFontStyles={styles.invalidButtonText}
                onPress={() => {
                  setInvalidQR(false);
                  triggerScanModal(true);
                }}
              />
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={
            isAmountInputTriggered
              ? {
                  height: Dimensions.get('window').height - 255,
                }
              : styles.amountsContainer
          }>
          <View style={styles.amountHeaderContainer}>
            <Text style={styles.amountHeaderText}>CHOOSE AMOUNT</Text>
          </View>

          <AmountInput
            onChangeText={(input) => setAmount(input)}
            onAccept={() => triggerAmountInput(false)}
            selected={() => triggerAmountInput(true)}
            confirmButtonText="Confirm"
          />
        </View>
      )}

      {isAmountInputTriggered ? null : (
        <>
          <LinearGradient
            colors={
              Platform.OS === 'android'
                ? ['#eef4f9', '#eef4f9']
                : ['#F6F9FC', '#d2e1ef00']
            }
            style={styles.flex}>
            <ScrollView style={styles.flex}>
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

              <View style={styles.recipientHeaderContainer}>
                <Text style={styles.descriptionHeaderText}>
                  ADD Description
                </Text>
                <InputField
                  onChangeText={(text) => changeMemo(text)}
                  value={memo}
                />
              </View>
            </ScrollView>
          </LinearGradient>

          <View style={styles.sendContainer}>
            <BlueButton
              value="Send"
              onPress={() => triggerSendModal(true)}
              disabled={isConfirmDisabled}
            />
          </View>
        </>
      )}

      <SendModal
        isVisible={isSendModalTriggered}
        close={() => triggerSendModal(false)}
        amount={amount}
        address={address}
        memo={memo}
        handleConfirm={handleConfirm}
      />

      <PinModal
        isVisible={isPinModalTriggered}
        close={() => triggerPinModal(false)}
        handleValidationFailure={() => handleValidationFailure()}
        handleValidationSuccess={() => handleValidationSuccess()}
      />

      <ScanModal
        isVisible={isScanModalTriggered}
        close={() => triggerScanModal(false)}
        handleQRRead={(data) => handleScanCallback(data)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  recipientContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-evenly',
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
    justifyContent: 'center',
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
    backgroundColor: 'rgb(238,244,249)',
  },
  notch: {
    height: 200,
  },
  noNotch: {
    height: 165,
  },
  invalidContainer: {
    height: 155,
  },
  invalidPasteContainer: {
    height: 120,
  },
  invalidHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 41,
    paddingRight: 41,
    paddingTop: 20,
    paddingBottom: 15,
  },
  invalidHeaderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    paddingLeft: 12,
  },
  invalidHeaderTextContainer: {
    flexDirection: 'row',
  },
  invalidText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: -0.28,
    lineHeight: 13,
    width: 300,
    paddingLeft: 41,
  },
  invalidButtonContainer: {
    paddingLeft: 41,
    paddingTop: 15,
  },
  invlaidButtonSubcontainer: {
    width: 86,
  },
  invalidButtonText: {
    color: '#F04E37',
    fontSize: 11,
  },
  amountsContainer: {
    height: 132,
  },
});

Send.navigationOptions = () => {
  return {
    headerTitle: 'Send',
    headerBackTitleVisible: false,
  };
};

export default Send;
