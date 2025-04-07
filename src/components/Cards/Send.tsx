import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {Platform, ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import {decodeBIP21} from '../../lib/utils/bip21';
import {validate as validateLtcAddress} from '../../lib/utils/validate';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import AmountPicker from '../Buttons/AmountPicker';
import BuyPad from '../Numpad/BuyPad';
import {sleep} from '../../lib/utils/poll';
import {showError} from '../../reducers/errors';
import {resetInputs} from '../../reducers/input';
import {
  litecoinToSubunitSelector,
  subunitToSatsSelector,
} from '../../reducers/settings';
import {
  updateAmount,
  updateFiatAmount,
  updateSendAmount,
  updateSendLabel,
  updateSendAddress,
  updateSendDomain,
} from '../../reducers/input';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
  ConfirmSend: undefined;
};

interface Props {
  route: RouteProp<RootStackParamList, 'Main'>;
}

interface URIHandlerRef {
  handleURI: (data: string) => void;
}

const Send = forwardRef<URIHandlerRef, Props>((props, ref) => {
  const {route} = props;

  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const scrollViewRef = useRef<ScrollView | null>(null);

  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));
  const convertLitecoinToSubunit = useAppSelector(state =>
    litecoinToSubunitSelector(state),
  );
  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const confirmedBalance = useAppSelector(
    state => state.balance.confirmedBalance,
  );

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [address, setAddress] = useState('');
  const [addressDomain, setAddressDomain] = useState('');
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [toggleLTC, setToggleLTC] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [amountPickerActive, setAmountPickerActive] = useState(false);
  const [isSendDisabled, setSendDisabled] = useState<boolean>(true);

  // check if ready to send
  useEffect(() => {
    const check = async () => {
      // check user balance
      if (!amount) {
        setSendDisabled(true);
        return;
      }

      // validate balance
      const amountInSats = convertToSats(Number(amount));
      if (amountInSats > Number(confirmedBalance)) {
        setSendDisabled(true);
        return;
      }

      // validate address
      if (address !== '') {
        const valid = await validateLtcAddress(address);
        if (!valid) {
          setSendDisabled(true);
          return;
        }
      } else {
        setSendDisabled(true);
        return;
      }

      // otherwise enable send
      setSendDisabled(false);
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, description, amount, confirmedBalance]);

  // qr code scanner result handler
  useEffect(() => {
    if (route.params?.scanData) {
      handleScanCallback(route.params?.scanData);
      navigation.setParams({scanData: undefined});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.scanData]);

  const handleScan = () => {
    navigation.navigate('Scan', {returnRoute: 'Main'});
  };

  const handleScanCallback = async (data: any) => {
    try {
      await validate(data);
    } catch (error) {
      dispatch(showError('Invalid Litecoin Address in QR Code'));
      return;
    }
  };

  const handlePaste = async () => {
    const paste = await Clipboard.getString();
    await validate(paste);
  };

  // uri handler
  useImperativeHandle(ref, () => ({
    async handleURI(data) {
      await validate(data);
    },
  }));

  // validates data before sending!
  const validate = async data => {
    try {
      // handle BIP21 litecoin URI
      if (data.startsWith('litecoin:')) {
        const decoded = decodeBIP21(data);
        const valid = await validateLtcAddress(decoded.address);

        // BIP21 validation
        if (!valid) {
          throw new Error('Invalid BIP21 URI.');
        }

        // If additional data included, set amount/address
        if (decoded.options.amount) {
          // BIP21 uses decimal Litecoin subunit
          // convert Litecoin to currently selected subunit
          const amt = convertLitecoinToSubunit(Number(decoded.options.amount));
          dispatch(updateAmount(amt.toString(), 'ltc'));
        }
        // Could be setting wrong labels
        // if (decoded.options.message) {
        //   setDescription(decoded.options.message);
        // }
        setAddress(decoded.address);

        return;
      }

      // handle Litecoin Address
      const valid = await validateLtcAddress(data);

      if (!valid) {
        throw new Error('Address');
      } else {
        setAddress(data);
        return;
      }
    } catch (error) {
      throw new Error(String(error));
    }
  };

  const onChange = (value: string) => {
    if (toggleLTC) {
      dispatch(updateAmount(value, 'ltc'));
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value, 'ltc'));
    }
  };

  // animation
  const padOpacity = useSharedValue(0);
  const detailsOpacity = useSharedValue(1);

  useEffect(() => {
    if (amountPickerActive) {
      padOpacity.value = withTiming(1, {duration: 400});
    } else {
      padOpacity.value = withTiming(0, {}, () => {
        detailsOpacity.value = withTiming(1, {duration: 200});
      });
    }
  }, [amountPickerActive, detailsOpacity, padOpacity]);

  const validateAddress = async (endAddress: string) => {
    if (endAddress === '') {
      setAddressValid(null);
      return;
    }
    if (address === '') {
      setAddressValid(null);
      return;
    }

    let addressOnValidation = endAddress;

    const matched = endAddress.match(/^[a-zA-Z0-9-]{1,24}\.ltc$/);

    if (matched) {
      const res = await fetch(
        'https://api.nexuswallet.com/api/domains/resolve-unstoppable',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            domain: endAddress,
          }),
        },
      );

      if (!res.ok) {
        setAddressValid(null);
        dispatch(showError('Invalid domain name'));
        return;
      }

      const data = await res.json();

      if (data && data.hasOwnProperty('address')) {
        addressOnValidation = data.address;
        // set domain to render in ui
        setAddressDomain(endAddress);
        // update address for another validation function
        setAddress(addressOnValidation);
      } else {
        setAddressValid(null);
        return;
      }
    }

    const valid = await validateLtcAddress(addressOnValidation);

    if (!valid) {
      setAddressValid(false);
      dispatch(showError('Invalid address'));
    } else {
      setAddressValid(true);
    }
  };

  const handleSend = () => {
    const amountInSats = convertToSats(Number(amount));
    dispatch(updateSendAmount(amountInSats));
    dispatch(updateSendAddress(address));
    dispatch(updateSendDomain(addressDomain));
    dispatch(updateSendLabel(description));
    // dispatch(updateSendFee(recommendedFeeInSatsVByte));

    navigation.navigate('ConfirmSend');
  };

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const scrollToInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y, animated: true});
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        scrollEnabled={false}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}>
        <TranslateText
          textKey="send_ltc"
          domain="sendTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.025}
          textStyle={styles.titleText}
          numberOfLines={1}
        />

        <View style={styles.amountContainer}>
          <TranslateText
            textKey="amount"
            domain="sendTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.subtitleText}
            numberOfLines={1}
          />
          <AmountPicker
            amount={amount}
            fiatAmount={fiatAmount}
            active={amountPickerActive}
            handlePress={() => {
              detailsOpacity.value = withTiming(0, {duration: 200});
              setAmountPickerActive(true);
            }}
            handleToggle={() => setToggleLTC(!toggleLTC)}
          />
        </View>

        {amountPickerActive ? null : (
          <Animated.View
            style={{...styles.subContainer, opacity: detailsOpacity}}>
            <View style={styles.cellContainer}>
              <View style={styles.subtitlesContainer}>
                <TranslateText
                  textKey="send_to_address"
                  domain="sendTab"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.subtitleText}
                  numberOfLines={1}
                />
                {!addressValid && addressValid !== null ? (
                  <TranslateText
                    textKey="address_invalid"
                    domain="sendTab"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                    textStyle={styles.subtitleText}
                    numberOfLines={1}
                  />
                ) : null}
              </View>
              <View style={styles.inputFieldContainer}>
                <AddressField
                  address={addressDomain ? addressDomain : address}
                  onChangeText={setAddress}
                  onScanPress={handleScan}
                  onPastePress={handlePaste}
                  validateAddress={endAddress => validateAddress(endAddress)}
                  onBlur={() => scrollToInput(0)}
                  onFocus={() => scrollToInput(SCREEN_HEIGHT * 0.13)}
                  clearInput={() => setAddress('')}
                />
              </View>
            </View>

            <View style={styles.cellContainer}>
              <TranslateText
                textKey="description"
                domain="sendTab"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={styles.subtitleText}
                numberOfLines={1}
              />
              <View style={styles.inputFieldContainer}>
                <InputField
                  value={description}
                  onChangeText={text => setDescription(text)}
                  onBlur={() => scrollToInput(0)}
                  onFocus={() => scrollToInput(SCREEN_HEIGHT * 0.23)}
                  clearInput={() => setDescription('')}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {amountPickerActive ? null : (
        <Animated.View
          style={[styles.bottomBtnsContainer, {opacity: detailsOpacity}]}>
          <View style={styles.bottomBtns}>
            {/* <View style={styles.greenBtnContainer}>
           <GreenButton
            value={`FEE ${recommendedFeeInSatsVByte} sat/b`}
            onPress={() => console.log('pressed fee')}
          />
        </View>  */}
            <View
              style={[
                styles.blueBtnContainer,
                Platform.OS === 'android'
                  ? {paddingBottom: insets.bottom}
                  : null,
              ]}>
              <BlueButton
                textKey="send_litecoin"
                textDomain="sendTab"
                onPress={() => {
                  handleSend();
                }}
                disabled={isSendDisabled}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {amountPickerActive ? (
        <Animated.View
          style={[
            styles.numpadContainer,
            {opacity: padOpacity},
            Platform.OS === 'android'
              ? {paddingBottom: insets.bottom - 20}
              : null,
          ]}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={toggleLTC ? String(amount) : String(fiatAmount)}
          />
          <View
            style={[
              styles.blueBtnContainerStandalone,
              Platform.OS === 'android' ? {paddingTop: 0} : null,
            ]}>
            <BlueButton
              textKey="confirm"
              textDomain="sendTab"
              onPress={async () => {
                padOpacity.value = withTiming(0, {duration: 230});
                await sleep(230);
                setAmountPickerActive(false);
              }}
              disabled={false}
            />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
});

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      // BottomSheet is screenHeight * 0.76
      // DashboardButton is 110
      // Header margin is 5
      height: screenHeight * 0.76 - 110 - 5,
      backgroundColor: '#f7f7f7',
      // backgroundColor: 'red',
      paddingHorizontal: screenWidth * 0.06,
      position: 'relative',
    },
    scrollViewContent: {
      minHeight: screenHeight,
    },
    subContainer: {
      flex: 1,
    },
    titleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.025,
    },
    cellContainer: {
      marginTop: screenHeight * 0.03,
    },
    subtitlesContainer: {
      flexDirection: 'row',
    },
    amountContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subtitleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#747E87',
      fontSize: screenHeight * 0.012,
    },
    inputFieldContainer: {
      paddingTop: 5,
    },
    numpadContainer: {
      position: 'absolute',
      width: screenWidth,
      bottom: screenHeight * 0.03,
    },
    bottomBtnsContainer: {
      position: 'absolute',
      left: screenWidth * 0.06,
      bottom: screenHeight * 0.03,
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
    bottomBtns: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    greenBtnContainer: {
      flexBasis: '37%',
    },
    blueBtnContainer: {
      flex: 1,
    },
    // this button style regulates relative BuyPad
    blueBtnContainerStandalone: {
      flex: 1,
      paddingTop: screenHeight * 0.025,
      paddingHorizontal: screenWidth * 0.06,
    },
  });

export default Send;
