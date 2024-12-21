import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';

import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import GreenButton from '../Buttons/GreenButton';
import {decodeBIP21} from '../../lib/utils/bip21';
import {validate as validateLtcAddress} from '../../lib/utils/validate';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  updateAmount,
  updateFiatAmount,
  updateSendToAddress,
  updateSendFee,
  updateSendAmount,
  updateSendLabel,
} from '../../reducers/input';
import AmountPicker from '../Buttons/AmountPicker';
import BuyPad from '../Numpad/BuyPad';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {sleep} from '../../lib/utils/poll';
import {showError} from '../../reducers/errors';

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

const Send: React.FC<Props> = props => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const {route} = props;

  const amount = useAppSelector(state => state.input.amount);
  const fiatAmount = useAppSelector(state => state.input.fiatAmount);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [address, setAddress] = useState('');
  const [toggleLTC, setToggleLTC] = useState<boolean>(true);
  const [description, setDescription] = useState('');
  const [amountPickerActive, setAmountPickerActive] = useState(false);

  const [recommendedFeeInSatsVByte, setRecommendedFeeInSatsVByte] = useState(1);

  const padOpacity = useSharedValue(0);
  const detailsOpacity = useSharedValue(1);

  // qr code scanner result handler
  useEffect(() => {
    if (route.params?.scanData) {
      handleScanCallback(route.params?.scanData);
      navigation.setParams({scanData: undefined});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.scanData]);

  // change address handler
  useEffect(() => {
    dispatch(updateSendToAddress(address));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // change description handler
  useEffect(() => {
    dispatch(updateSendLabel(description));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  // change fee handler
  useEffect(() => {
    dispatch(updateSendFee(recommendedFeeInSatsVByte));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedFeeInSatsVByte]);

  const handleScan = () => {
    navigation.navigate('Scan', {returnRoute: 'Main'});
  };

  const handleScanCallback = async data => {
    try {
      await validate(data);
    } catch (error) {
      dispatch(showError(`QR Code has invalid ${error}`));
      return;
    }
  };

  // validates data before sending!
  const validate = async data => {
    try {
      // handle BIP21 litecoin URI
      if (data.startsWith('litecoin:')) {
        const decoded = decodeBIP21(data);
        const valid = await validateLtcAddress(decoded.address);

        // BIP21 validation
        if (!valid) {
          throw new Error('URI');
        }

        // If additional data included, set amount/address
        if (decoded.options.amount) {
          // setAmount(decoded.options.amount);
          dispatch(updateSendAmount(decoded.options.amount));
        }
        if (decoded.options.message) {
          setDescription(decoded.options.message);
        }
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
  useEffect(() => {
    if (amountPickerActive) {
      padOpacity.value = withTiming(1, {duration: 400});
    } else {
      padOpacity.value = withTiming(0, {}, () => {
        detailsOpacity.value = withTiming(1, {duration: 200});
      });
    }
  }, [amountPickerActive, detailsOpacity, padOpacity]);

  async function getRecommendedFee() {
    try {
      const req = await fetch(
        'https://litecoinspace.org/api/v1/fees/recommended',
      );
      const data: any = await req.json();

      if (data.hasOwnProperty('fastestFee')) {
        setRecommendedFeeInSatsVByte(data.fastestFee);
      } else {
        throw new Error('Could not find recommended fees.');
      }
    } catch {
      setRecommendedFeeInSatsVByte(1);
    }
  }

  useEffect(() => {
    getRecommendedFee();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Send LTC</Text>

      <View style={styles.amountContainer}>
        <Text style={styles.subtitleText}>AMOUNT</Text>
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
            <Text style={styles.subtitleText}>TO ADDRESS</Text>
            <View style={styles.inputFieldContainer}>
              <AddressField
                address={address}
                onChangeText={setAddress}
                onScanPress={handleScan}
              />
            </View>
          </View>

          <View style={styles.cellContainer}>
            <Text style={styles.subtitleText}>DESCRIPTION</Text>
            <View style={styles.inputFieldContainer}>
              <InputField
                value={description}
                onChangeText={text => setDescription(text)}
              />
            </View>
          </View>

          <View style={styles.bottomBtnsContainer}>
            <View style={styles.bottomBtns}>
              <View style={styles.greenBtnContainer}>
                <GreenButton
                  value={`FEE ${recommendedFeeInSatsVByte} sat/b`}
                  onPress={() => console.log('pressed fee')}
                />
              </View>
              <View style={styles.blueBtnContainer}>
                <BlueButton
                  value={`Send ${amount} LTC`}
                  onPress={() => {
                    navigation.navigate('ConfirmSend');
                  }}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {amountPickerActive ? (
        <Animated.View style={[styles.numpadContainer, {opacity: padOpacity}]}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={toggleLTC ? String(amount) : String(fiatAmount)}
          />
          <View style={{paddingHorizontal: 20, paddingTop: 7}}>
            <BlueButton
              disabled={false}
              value="Confirm"
              onPress={async () => {
                padOpacity.value = withTiming(0, {duration: 230});
                await sleep(230);
                setAmountPickerActive(false);
              }}
            />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      // DashboardButton is 110
      height: screenHeight * 0.76 - 110,
      backgroundColor: '#f7f7f7',
      paddingHorizontal: screenWidth * 0.06,
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
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'flex-end',
      paddingBottom: screenHeight * 0.03,
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
      flexBasis: '60%',
    },
  });

export default Send;
