import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Platform, Pressable} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import NewBlueButton from '../Buttons/NewBlueButton';
import NewButton from '../Buttons/NewButton';
import InfoModal from '../Modals/InfoModal';

interface Props {}

const Receive: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const address = useAppSelector(state => state.address.address);

  const [mwebAddress, setMwebAddress] = useState(false);
  const [uri, setURI] = useState('');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);

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

  const handleCopy = async () => {
    setInfoModalVisible(true);
    Clipboard.setString(address);
  };

  const handleShare = () => {
    Share.open({message: 'hello'});
  };

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
        <Text style={styles.titleText}>Receive LTC</Text>

        <View style={styles.txTypeContainer}>
          <NewBlueButton
            title="Litecoin"
            active={!mwebAddress}
            onPress={() => {
              dispatch(getAddress(false));
              setMwebAddress(false);
            }}
          />
          <NewBlueButton
            title="Send Privately"
            active={mwebAddress}
            onPress={() => {
              dispatch(getAddress(true));
              setMwebAddress(true);
            }}
          />
        </View>

        <Text style={styles.subtitleText}>MY LTC ADDRESS</Text>
        <View style={styles.addressContainer}>
          <Pressable onPress={() => handleCopy()}>
            <Text style={styles.addressText}>{address}</Text>
          </Pressable>

          <NewButton
            onPress={() => handleShare()}
            imageSource={require('../../assets/icons/share-icon.png')}
          />
        </View>
      </View>
      <View style={styles.qrContainer}>
        {uri ? <QRCode value={uri} size={200} /> : null}
      </View>
      {mwebAddress ? (
        <Text style={styles.minText}>
          Sending privately hides the sender and receiver addresses, and amount
          being sent.
        </Text>
      ) : null}

      <InfoModal
        isVisible={isInfoModalVisible}
        close={() => setInfoModalVisible(false)}
        textColor="green"
        text="COPIED TO CLIPBOARD!"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    flexDirection: 'column',
    maxHeight: 530,
  },
  subcontainer: {
    marginHorizontal: 24,
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
  },
  txTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 19,
    paddingBottom: 22,
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
    flex: 1,
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
    width: 300,
  },
  minText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'center',
    paddingHorizontal: 60,
    paddingTop: 8,
  },
});

export default Receive;
