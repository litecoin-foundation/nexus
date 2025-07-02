import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useImperativeHandle,
  forwardRef,
  useLayoutEffect,
} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {estimateFee} from 'react-native-turbo-lndltc';

import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import AmountPicker from '../Buttons/AmountPicker';
import BuyPad from '../Numpad/BuyPad';
import {decodeBIP21} from '../../lib/utils/bip21';
import {validate as validateLtcAddress} from '../../lib/utils/validate';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
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

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
  ConfirmSend: {
    sendAll: boolean;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'Main'>;
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
}

interface URIHandlerRef {
  handleURI: (data: string) => void;
}

const Send = forwardRef<URIHandlerRef, Props>((props, ref) => {
  const {route} = props;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<Props['navigation']>();

  const scrollViewRef = useRef<ScrollView | null>(null);

  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));
  const convertLitecoinToSubunit = useAppSelector(state =>
    litecoinToSubunitSelector(state),
  );
  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);
  const {confirmedBalance, totalBalance} = useAppSelector(
    state => state.balance,
  );
  const balanceMinus001 = Number(confirmedBalance) - 1000000;
  const syncedToChain = useAppSelector(state => state.info.syncedToChain);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [address, setAddress] = useState('');
  const [addressDomain, setAddressDomain] = useState('');
  const [showResolvedDomain, setShowResolvedDomain] = useState<boolean>(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [toggleLTC, setToggleLTC] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [amountPickerActive, setAmountPickerActive] = useState(false);
  const [isSendDisabled, setSendDisabled] = useState<boolean>(true);
  const [noteKey, setNoteKey] = useState<string>('');

  const [activateSendAll, setActivateSendAll] = useState(false);

  const [sendOutFee, setSendOutFee] = useState(0);
  // pre estimate fee
  useLayoutEffect(() => {
    const calculateFee = async () => {
      try {
        const response = await estimateFee({
          AddrToAmount: {
            ['MQd1fJwqBJvwLuyhr17PhEFx1swiqDbPQS']: BigInt(balanceMinus001),
          },
          targetConf: 2,
        });
        setSendOutFee(Number(response.feeSat));
      } catch (error) {
        console.error(error);
      }
    };
    calculateFee();
  }, [balanceMinus001]);
  // estimate fee with input address
  useEffect(() => {
    if (address) {
      const calculateFee = async () => {
        try {
          const valid = validateLtcAddress(address);
          if (valid) {
            const response = await estimateFee({
              AddrToAmount: {[address]: BigInt(balanceMinus001)},
              targetConf: 2,
            });
            setSendOutFee(Number(response.feeSat));
          }
        } catch (error) {
          console.error(error);
        }
      };
      calculateFee();
    }
  }, [balanceMinus001, address]);

  const setMax = () => {
    dispatch(
      updateAmount(
        parseFloat(
          String(Number(confirmedBalance) / 100000000 - sendOutFee / 100000000),
        ).toFixed(6),
        'ltc',
      ),
    );
  };

  // check if ready to send
  useEffect(() => {
    const check = async () => {
      // NOTE: when wallet isn't fully synced, balance is showed as not confirmed
      // hence cannot send the coins
      if (totalBalance !== confirmedBalance) {
        setNoteKey('balance_unconfirmed');
        return;
      }

      if (!syncedToChain) {
        setNoteKey('wallet_unsynced');
        return;
      }

      if (!amount || Number(amount) <= 0) {
        setSendDisabled(true);
        return;
      }

      // validate balance
      const amountInSats = convertToSats(Number(amount));
      if (amountInSats > Number(confirmedBalance)) {
        // setNoteKey('insufficient_funds');
        // setSendDisabled(true);
        setMax();
        return;
      }

      if (amountInSats > Number(confirmedBalance) - sendOutFee) {
        // setNoteKey('try_less_amount');
        // setSendDisabled(true);
        setMax();
        return;
      }

      // validate address
      if (address !== '') {
        const valid = validateLtcAddress(address);
        if (!valid) {
          setNoteKey('');
          setSendDisabled(true);
          return;
        }
      } else {
        setNoteKey('');
        setSendDisabled(true);
        return;
      }

      // force send all flag for lnd with 1000 sats margin
      if (amountInSats + 1000 > Number(confirmedBalance) - sendOutFee) {
        setActivateSendAll(true);
      } else {
        setActivateSendAll(false);
      }

      // otherwise enable send
      setSendDisabled(false);
      setNoteKey('');
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    address,
    description,
    amount,
    confirmedBalance,
    syncedToChain,
    sendOutFee,
  ]);

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
  const validate = async (data: any) => {
    try {
      // handle BIP21 litecoin URI
      if (data.startsWith('litecoin:')) {
        const decoded = decodeBIP21(data);
        const valid = validateLtcAddress(decoded.address);

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
      const valid = validateLtcAddress(data);

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
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      try {
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
            signal: abortController.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          setAddressValid(null);
          if (res.status >= 500) {
            dispatch(showError('Domain resolution service temporarily unavailable'));
          } else if (res.status === 404) {
            dispatch(showError('Domain not found'));
          } else {
            dispatch(showError('Invalid domain name'));
          }
          return;
        }

        const data = await res.json();

        if (data && data.hasOwnProperty('address') && data.address) {
          addressOnValidation = data.address;
          // set domain to render in ui
          setAddressDomain(endAddress);
          setShowResolvedDomain(true);
          // update address for another validation function
          setAddress(addressOnValidation);
        } else {
          setAddressValid(null);
          dispatch(showError('Domain does not resolve to a valid address'));
          return;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        setAddressValid(null);
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            dispatch(showError('Domain resolution timed out'));
          } else if (error.message.includes('Network request failed')) {
            dispatch(showError('Network error - check your connection'));
          } else {
            dispatch(showError('Domain resolution failed'));
          }
        } else {
          dispatch(showError('Domain resolution failed'));
        }
        return;
      }
    }

    try {
      const valid = validateLtcAddress(addressOnValidation);

      if (valid) {
        setAddressValid(true);
      } else {
        setAddressValid(false);
      }
    } catch (error) {
      setAddressValid(false);
      dispatch(showError('Address validation failed'));
    }
  };

  const handleSend = () => {
    const amountInSats = convertToSats(Number(amount));
    dispatch(updateSendAmount(amountInSats));
    dispatch(updateSendAddress(address));
    dispatch(updateSendDomain(addressDomain));
    dispatch(updateSendLabel(description));
    // dispatch(updateSendFee(recommendedFeeInSatsVByte));

    navigation.navigate('ConfirmSend', {sendAll: activateSendAll});
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
          textKey="send_litecoin"
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
          <View style={styles.amountSubContainer}>
            {/* <Pressable onPress={() => setMax()} style={styles.maxButton}>
              <TranslateText
                textValue="MAX"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.buttonText}
                numberOfLines={1}
              />
            </Pressable> */}
            <AmountPicker
              amount={amount}
              fiatAmount={fiatAmount}
              active={amountPickerActive}
              handlePress={() => {
                detailsOpacity.value = withTiming(0, {duration: 200});
                setAmountPickerActive(true);
              }}
              handleToggle={() => setToggleLTC(!toggleLTC)}
              setMax={setMax}
            />
          </View>
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
                  address={showResolvedDomain ? addressDomain : address}
                  onChangeText={e => {
                    setShowResolvedDomain(false);
                    setAddress(e);
                  }}
                  onScanPress={handleScan}
                  onPastePress={handlePaste}
                  validateAddress={endAddress => validateAddress(endAddress)}
                  onBlur={() => scrollToInput(0)}
                  onFocus={() => scrollToInput(SCREEN_HEIGHT * 0.13)}
                  clearInput={() => {
                    setAddress('');
                    setAddressDomain('');
                  }}
                />
              </View>
            </View>

            <View style={styles.cellContainerMoreMargin}>
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
          style={[styles.bottomContainer, {opacity: detailsOpacity}]}>
          <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
            <View style={styles.row}>
              {/* <View style={styles.greenBtnContainer}>
           <GreenButton
            value={`FEE ${recommendedFeeInSatsVByte} sat/b`}
            onPress={() => console.log('pressed fee')}
          />
        </View>  */}
              <View style={styles.blueBtnContainer}>
                <BlueButton
                  textKey="send_litecoin"
                  textDomain="sendTab"
                  onPress={() => {
                    handleSend();
                  }}
                  disabled={isSendDisabled}
                />

                {noteKey ? (
                  <TranslateText
                    textKey={noteKey}
                    domain="sendTab"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                    textStyle={styles.minText}
                    numberOfLines={3}
                  />
                ) : null}
              </View>
            </View>
          </CustomSafeAreaView>
        </Animated.View>
      )}

      {amountPickerActive ? (
        <Animated.View
          style={[styles.amountPickerActiveBottom, {opacity: padOpacity}]}>
          <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
            <View style={styles.col}>
              <View style={styles.numpadContainer}>
                <BuyPad
                  onChange={(value: string) => onChange(value)}
                  currentValue={toggleLTC ? String(amount) : String(fiatAmount)}
                  small
                />
              </View>
              <View style={styles.blueBtnContainer}>
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
            </View>
          </CustomSafeAreaView>
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
      paddingHorizontal: screenWidth * 0.06,
      position: 'relative',
    },
    scrollViewContent: {
      minHeight: screenHeight,
    },
    subScrollContainer: {
      width: '100%',
      height: screenHeight * 0.76 - 110 - 5,
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
      marginTop: screenHeight * 0.035,
    },
    cellContainerMoreMargin: {
      marginTop: screenHeight * 0.06,
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
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
    },
    amountSubContainer: {
      flexBasis: '70%',
      height: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    maxButton: {
      width: 'auto',
      height: '100%',
      minWidth: screenHeight * 0.06,
      minHeight: screenHeight * 0.06,
      borderRadius: screenHeight * 0.01,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: screenWidth * 0.02,
      marginHorizontal: screenWidth * 0.02,
    },
    buttonText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
    },
    inputFieldContainer: {
      paddingTop: 5,
    },
    bottomContainer: {
      position: 'absolute',
      left: screenWidth * 0.06,
      bottom: 0,
      width: '100%',
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    greenBtnContainer: {
      flexBasis: '37%',
    },
    blueBtnContainer: {
      width: '100%',
    },
    safeArea: {
      flex: 1,
    },
    amountPickerActiveBottom: {
      position: 'absolute',
      left: screenWidth * 0.06,
      bottom: 0,
      width: '100%',
    },
    col: {
      gap: screenHeight * 0.03,
      alignItems: 'center',
    },
    numpadContainer: {
      width: screenWidth,
    },
    buttonContainer: {
      width: '100%',
    },
    minText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      textAlign: 'center',
      marginTop: screenHeight * 0.01,
    },
  });

export default Send;
