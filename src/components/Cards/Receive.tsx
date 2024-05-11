import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import NewBlueButton from '../Buttons/NewBlueButton';
import NewButton from '../Buttons/NewButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import QRCode from 'react-native-qrcode-svg';

interface Props {}

const Receive: React.FC<Props> = props => {
  const dispatch = useAppDispatch();
  const address = useAppSelector(state => state.address.address);

  const [mwebAddress, setMwebAddress] = useState(false);
  const [uri, setURI] = useState('');

  // generate fresh new address on launch
  useEffect(() => {
    // TODO: fix bug where RPC isn't ready for new address
    dispatch(getAddress());
    setURI(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update qr code when address changes
  useEffect(() => {
    setURI(address);
  }, [address]);

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
        <Text style={styles.titleText}>Receive LTC</Text>

        <View style={styles.txTypeContainer}>
          <NewBlueButton
            title="Regular Litecoin"
            active={!mwebAddress}
            onPress={() => {
              dispatch(getAddress(false));
              setMwebAddress(false);
            }}
          />
          <NewBlueButton
            title="Stealth Litecoin"
            active={mwebAddress}
            onPress={() => {
              dispatch(getAddress(true));
              setMwebAddress(true);
            }}
          />
        </View>

        <Text style={styles.subtitleText}>MY LTC ADDRESS</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{address}</Text>
          <NewButton
            imageSource={require('../../assets/icons/share-icon.png')}
          />
        </View>
      </View>
      <View style={styles.qrContainer}>
        {uri ? <QRCode value={uri} size={200} /> : null}
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
    marginHorizontal: 24,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  qrContainer: {
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: 'rgba(217,217,217,0.45)',
    borderRadius: 12,
    marginHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: 248,
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
  addressText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#20BB74',
    fontSize: 18,
  },
});

export default Receive;
