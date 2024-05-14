import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';

import InputField from '../InputField';
import AddressField from '../AddressField';
import BlueButton from '../Buttons/BlueButton';
import {decodeBIP21} from '../../lib/utils/bip21';
import {validate as validateLtcAddress} from '../../lib/utils/validate';
import {useAppDispatch} from '../../store/hooks';
import {updateAmount} from '../../reducers/input';

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

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [invalidQR, setInvalidQR] = useState(false);

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
      setInvalidQR(true);
      return;
    }
  };

  const validate = async data => {
    try {
      // handle BIP21 litecoin URI
      if (data.startsWith('litecoin:')) {
        const decoded = decodeBIP21(data);
        const valid = await validateLtcAddress(decoded.address);

        // BIP21 validation
        if (!valid) {
          throw new Error('Invalid URI');
        }

        // If additional data included, set amount/address
        if (decoded.options.amount) {
          setAmount(decoded.options.amount);
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
        throw new Error('Invalid Address');
      } else {
        setAddress(data);
        return;
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
        <Text style={styles.titleText}>Send LTC</Text>

        <Text style={styles.subtitleText}>AMOUNT</Text>
        <Text>{amount}</Text>

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

        <View
          style={{
            position: 'absolute',
            bottom: 28,
            flexDirection: 'row',
            alignSelf: 'center',
            gap: 8,
          }}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
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
});

export default Send;
