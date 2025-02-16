import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import NewBlueButton from '../Buttons/NewBlueButton';
import NewButton from '../Buttons/NewButton';
import InfoModal from '../Modals/InfoModalContent';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Receive: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const address = useAppSelector(state => state.address.address);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, address.length);

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
    Share.open({message: address});
  };

  return (
    <>
      <View style={styles.container}>
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
          <Pressable
            style={styles.pressableContainer}
            onPress={() => handleCopy()}>
            <Text style={styles.addressText}>{address}</Text>
          </Pressable>

          <NewButton
            onPress={() => handleShare()}
            imageSource={require('../../assets/icons/share-icon.png')}
          />
        </View>

        <View style={styles.qrContainer}>
          {uri ? (
            <QRCode
              value={uri}
              size={
                address.length < 64
                  ? SCREEN_HEIGHT * 0.25
                  : SCREEN_HEIGHT * 0.18
              }
            />
          ) : null}
        </View>

        {mwebAddress ? (
          <Text style={styles.minText}>
            Sending privately hides the sender and receiver addresses, and
            amount being sent.
          </Text>
        ) : null}
      </View>
      <InfoModal
        isVisible={isInfoModalVisible}
        close={() => setInfoModalVisible(false)}
        textColor="green"
        textKey="copied"
        textDomain="main"
        disableBlur={true}
      />
    </>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  addressLength: number,
) =>
  StyleSheet.create({
    container: {
      // DashboardButton is 110
      height: screenHeight * 0.76 - 110,
      backgroundColor: '#f7f7f7',
      paddingHorizontal: screenWidth * 0.06,
    },
    titleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.025,
    },
    txTypeContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: screenHeight * 0.019,
      paddingBottom: screenHeight * 0.022,
    },
    subtitleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#747E87',
      fontSize: screenHeight * 0.017,
    },
    addressContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: screenHeight * 0.007,
    },
    pressableContainer: {
      flexBasis: '80%',
    },
    addressText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#20BB74',
      fontSize:
        addressLength < 64 ? screenHeight * 0.027 : screenHeight * 0.022,
    },
    qrContainer: {
      backgroundColor: '#FEFEFE',
      borderWidth: 1,
      borderColor: 'rgba(217,217,217,0.45)',
      borderRadius: screenHeight * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: screenWidth * 0.06,
      paddingVertical: screenHeight * 0.03,
    },
    minText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      color: '#747E87',
      textAlign: 'center',
      marginTop: screenWidth * 0.03,
      paddingHorizontal: screenWidth * 0.15,
    },
  });

export default Receive;
