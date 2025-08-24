import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {Pressable, ScrollView, StyleSheet, View, Image} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {Utxo} from 'react-native-turbo-lndltc/protos/lightning_pb';

import PlasmaModal from '../Modals/PlasmaModal';
import SelectCoinsModalContent from '../Modals/SelectCoinsModalContent';
import Switch from '../Buttons/Switch';
import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import AmountPicker from '../Buttons/AmountPicker';
import BuyPad from '../Numpad/BuyPad';
import {decodeBIP21} from '../../utils/bip21';
import {validate as validateLtcAddress} from '../../utils/validate';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {sleep} from '../../utils/poll';
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
import {PopUpContext} from '../../context/popUpContext';

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
  ConfirmSend: {
    sendAll: boolean;
    selectedUtxos?: Utxo[];
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
  const amount = useAppSelector(state => state.input!.amount);
  const fiatAmount = useAppSelector(state => state.input!.fiatAmount);
  const {confirmedBalance, totalBalance} = useAppSelector(
    state => state.balance!,
  );
  const manualCoinSelectionEnabled = useAppSelector(
    state => state.settings!.manualCoinSelectionEnabled,
  );
  const syncedToChain = useAppSelector(state => state.info!.syncedToChain);

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
  const [sendAll, setSendAll] = useState(false);
  const [selectedUtxosArray, setSelectedUtxosArray] = useState<Utxo[]>([]);

  // check if ready to send
  useEffect(() => {
    const check = async () => {
      if ((!amount || Number(amount) <= 0) && sendAll !== true) {
        setSendDisabled(true);
        return;
      }

      // NOTE: when wallet isn't fully synced, balance is showed as unconfirmed
      if (totalBalance !== confirmedBalance) {
        setSendDisabled(true);
        setNoteKey('balance_unconfirmed');
        return;
      }

      if (!syncedToChain) {
        setSendDisabled(true);
        setNoteKey('wallet_unsynced');
        return;
      }

      // validate balance
      const amountInSats = convertToSats(Number(amount));

      // check if amount being sent is > user balance
      if (amountInSats > Number(confirmedBalance)) {
        setSendDisabled(true);
        setNoteKey('try_less_amount');
        return;
      }

      // assume min amount of 0.0001 ltc and subtract it from balance for estimated fee calculations
      // if this number is below 0 disable sending and show setNoteKey('insufficient_funds')
      const balanceMinus00001 = Number(confirmedBalance) - 10000;
      if (balanceMinus00001 <= 0) {
        setSendDisabled(true);
        setNoteKey('insufficient_funds');
        return;
      }

      // validate address
      if (address !== '') {
        const valid = validateLtcAddress(address);
        if (!valid) {
          setNoteKey('this_address_invalid');
          setSendDisabled(true);
          return;
        }
      } else {
        setSendDisabled(true);
        return;
      }

      // if user attempts to send an amount within a 1000 sats range of the wallet balance
      // we force sendAll to true
      if (amountInSats + 1000 > Number(confirmedBalance)) {
        setSendAll(true);
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
    totalBalance,
    confirmedBalance,
    syncedToChain,
    sendAll,
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
        setAddressValid(true);

        return;
      }

      // handle Litecoin Address
      const valid = validateLtcAddress(data);

      if (!valid) {
        setAddressValid(null);
        throw new Error('Address');
      } else {
        setAddress(data);
        setAddressValid(true);
        return;
      }
    } catch (error) {
      throw new Error(String(error));
    }
  };

  const onChange = (value: string) => {
    setSendAll(false);

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

  const handleCoinSelectionUtxos = (selectedUtxos: Utxo[]) => {
    console.log('Selected UTXOs:', selectedUtxos);
    setSelectedUtxosArray(selectedUtxos);
    setModalVisible(false);
  };

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
            dispatch(
              showError('Domain resolution service temporarily unavailable'),
            );
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

    navigation.navigate('ConfirmSend', {
      sendAll,
      selectedUtxos: selectedUtxosArray,
    });
  };

  // Reset selected UTXOs when sendAll is enabled
  useEffect(() => {
    if (sendAll) {
      setSelectedUtxosArray([]);
    }
  }, [sendAll]);

  useEffect(() => {
    return function cleanup() {
      setSelectedUtxosArray([]);
      dispatch(resetInputs());
    };
  }, [dispatch]);

  const scrollToInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y, animated: true});
    }
  };

  const [enableManualSelection, setEnableManualSelection] = useState(false);
  const {showPopUp} = useContext(PopUpContext);
  const [modalVisible, setModalVisible] = useState(false);
  const openManualSelectionModal = () => {
    setModalVisible(true);
  };
  const closeManualSelectionModal = () => {
    // reset any existing selected utxos
    // when utxos are selected correctly, we directly change
    // the modalVisible state
    setSelectedUtxosArray([]);
    setModalVisible(false);
  };
  const manualSelectionModal = (
    <PlasmaModal
      isOpened={modalVisible}
      close={closeManualSelectionModal}
      isFromBottomToTop={true}
      animDuration={250}
      gapInPixels={SCREEN_HEIGHT * 0.15}
      backSpecifiedStyle={{backgroundColor: 'transparent'}}
      gapSpecifiedStyle={{backgroundColor: 'transparent'}}
      disableBlur={false}
      renderBody={(_, __, ___, ____, cardTranslateAnim) => (
        <SelectCoinsModalContent
          close={closeManualSelectionModal}
          cardTranslateAnim={cardTranslateAnim}
          targetAmount={Number(amount)}
          targetAddress={address}
          onConfirmSelection={selectedUtxos =>
            handleCoinSelectionUtxos(selectedUtxos)
          }
        />
      )}
    />
  );
  useEffect(() => {
    showPopUp(manualSelectionModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible]);

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
            <AmountPicker
              amount={amount}
              fiatAmount={fiatAmount}
              active={amountPickerActive}
              handlePress={() => {
                detailsOpacity.value = withTiming(0, {duration: 200});
                setAmountPickerActive(true);
              }}
              handleToggle={() => setToggleLTC(!toggleLTC)}
              setMax={() => setSendAll(true)}
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

            {/* Manual Coin Selection is only visible when enabled in Settings
              & user is not sending all*/}
            {manualCoinSelectionEnabled && !sendAll ? (
              <View style={styles.cellContainer}>
                <View style={styles.manualSelectionTop}>
                  <TranslateText
                    textKey="manual_coin_selection"
                    domain="sendTab"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                    textStyle={styles.subtitleText}
                    numberOfLines={1}
                  />
                  <Switch
                    initialValue={enableManualSelection}
                    onPress={() => {
                      setEnableManualSelection(!enableManualSelection);
                      // reset selected utxos
                      setSelectedUtxosArray([]);
                    }}
                  />
                </View>
                {enableManualSelection &&
                !(!amount || Number(amount) <= 0) &&
                addressValid ? (
                  <Pressable
                    style={styles.manualSelectionBottom}
                    onPress={openManualSelectionModal}>
                    <View style={styles.manualSelectionBottomTitleContainer}>
                      <TranslateText
                        textKey="amount_selected"
                        domain="sendTab"
                        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
                        textStyle={styles.manualSelectionBottomTitle}
                        numberOfLines={1}
                      />
                      <TranslateText
                        textKey="amount_selected_number"
                        domain="sendTab"
                        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
                        textStyle={styles.manualSelectionBottomTitle}
                        numberOfLines={1}
                        interpolationObj={{
                          amount: amount !== '' ? amount : '0',
                        }}
                      />
                    </View>
                    <View style={styles.manualSelectionBottomNoteContainer}>
                      <Image
                        style={styles.manualSelectionBottomNoteIcon}
                        source={require('../../assets/icons/info-icon.png')}
                      />
                      <TranslateText
                        textKey="manual_selection_note"
                        domain="sendTab"
                        maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                        textStyle={styles.manualSelectionBottomNote}
                        numberOfLines={2}
                        interpolationObj={{amount}}
                      />
                    </View>
                    <View style={styles.manualSelectionBottomArrowContainer}>
                      <Image
                        style={styles.manualSelectionBottomArrowIcon}
                        source={require('../../assets/images/back-icon.png')}
                      />
                    </View>
                  </Pressable>
                ) : (
                  <></>
                )}
              </View>
            ) : (
              <></>
            )}

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
      marginTop: screenHeight * 0.02,
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
    manualSelectionTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 5,
    },
    manualSelectionBottom: {
      width: '100%',
      height: screenHeight * 0.1,
      borderRadius: screenHeight * 0.015,
      borderColor: '#E8E8E8',
      borderWidth: 1,
      backgroundColor: '#2C72FF',
      padding: screenHeight * 0.015,
      gap: 10,
    },
    manualSelectionBottomTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: screenWidth * 0.1,
    },
    manualSelectionBottomTitle: {
      flexBasis: '50%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontStyle: 'normal',
      textTransform: 'uppercase',
    },
    manualSelectionBottomNoteContainer: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    manualSelectionBottomNoteIcon: {
      width: screenHeight * 0.022,
      height: screenHeight * 0.022,
      justifyContent: 'center',
      alignItems: 'center',
      objectFit: 'contain',
      marginTop: screenHeight * 0.003,
    },
    manualSelectionBottomNote: {
      flexBasis: '75%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
      fontWeight: '500',
      fontStyle: 'normal',
    },
    manualSelectionBottomArrowContainer: {
      position: 'absolute',
      top: 0,
      right: screenWidth * 0.03,
      height: screenHeight * 0.1,
      justifyContent: 'center',
    },
    manualSelectionBottomArrowIcon: {
      width: screenHeight * 0.016,
      height: screenHeight * 0.016,
      objectFit: 'contain',
      transform: 'rotate(180deg)',
    },
  });

export default Send;
