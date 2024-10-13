import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';

import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import {decodeBIP21} from '../../lib/utils/bip21';
import {validate as validateLtcAddress} from '../../lib/utils/validate';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {updateAmount, updateFiatAmount} from '../../reducers/input';
import AmountPicker from '../Buttons/AmountPicker';
import BuyPad from '../Numpad/BuyPad';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {sleep} from '../../lib/utils/poll';
import {showError} from '../../reducers/errors';

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

  const [address, setAddress] = useState('');
  const [toggleLTC, setToggleLTC] = useState<boolean>(true);
  const [description, setDescription] = useState('');
  const [amountPickerActive, setAmountPickerActive] = useState(false);

  const padOpacity = useSharedValue(0);
  const detailsOpacity = useSharedValue(1);

  // qr code scanner result handler
  useEffect(() => {
    if (route.params?.scanData) {
      handleScanCallback(route.params?.scanData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.scanData]);

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
          dispatch(updateAmount(decoded.options.amount));
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
      dispatch(updateAmount(value));
    } else if (!toggleLTC) {
      dispatch(updateFiatAmount(value));
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

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
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
          <Animated.View style={{flex: 1, opacity: detailsOpacity}}>
            <View style={{paddingTop: 24}}>
              <Text style={styles.subtitleText}>TO ADDRESS</Text>
              <View style={styles.inputFieldContainer}>
                <AddressField
                  address={address}
                  onChangeText={setAddress}
                  onScanPress={handleScan}
                />
              </View>
            </View>

            <View style={{paddingTop: 24}}>
              <Text style={styles.subtitleText}>DESCRIPTION</Text>
              <View style={styles.inputFieldContainer}>
                <InputField
                  value={description}
                  onChangeText={text => setDescription(text)}
                />
              </View>
            </View>

            <View style={styles.bottomButtonContainer}>
              <BlueButton
                value={'Fee'}
                onPress={() => console.log('pressed fee')}
              />
              <BlueButton
                value={`Send ${amount} LTC`}
                onPress={() => {
                  console.log('pressed send');
                  navigation.navigate('ConfirmSend');
                }}
              />
            </View>
          </Animated.View>
        )}
      </View>

      {amountPickerActive ? (
        <Animated.View style={[styles.numpadContainer, {opacity: padOpacity}]}>
          <BuyPad
            onChange={(value: string) => onChange(value)}
            currentValue={toggleLTC ? String(amount) : String(fiatAmount)}
          />
          <View style={{paddingHorizontal: 24, paddingTop: 7}}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    maxHeight: 680,
  },
  subcontainer: {
    flex: 1,
    marginHorizontal: 24,
  },
  inputFieldContainer: {
    paddingTop: 5,
  },
  titleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 24,
  },
  subtitleText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numpadContainer: {
    position: 'absolute',
    bottom: 162,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 150,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
});

export default Send;
