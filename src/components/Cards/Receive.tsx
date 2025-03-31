import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import NewBlueButton from '../Buttons/NewBlueButton';
import NewButton from '../Buttons/NewButton';
import InfoModal from '../Modals/InfoModalContent';
import LoadingIndicator from '../../components/LoadingIndicator';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Receive: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const address = useAppSelector(state => state.address.address);
  const lndActive = useAppSelector(state => state.lightning.lndActive);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, address.length);

  const [mwebAddress, setMwebAddress] = useState('');
  const [isMwebAddress, setIsMwebAddress] = useState(false);
  const [uri, setURI] = useState('');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // generate fresh new address on launch
  useEffect(() => {
    // check if RPC is ready for new address
    if (lndActive) {
      dispatch(getAddress());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lndActive]);

  // update qr code when address changes
  useEffect(() => {
    setURI(address);
    if (isMwebAddress) {
      setMwebAddress(address);
    }
  }, [address, isMwebAddress]);

  // handle loading indicator
  useEffect(() => {
    if (isMwebAddress) {
      setLoading(mwebAddress ? false : true);
    } else {
      setLoading(address ? false : true);
    }
  }, [address, mwebAddress, isMwebAddress]);

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
        <TranslateText
          textKey="receive_ltc"
          domain="receiveTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.025}
          textStyle={styles.titleText}
          numberOfLines={1}
        />

        <View style={styles.txTypeContainer}>
          <NewBlueButton
            title="Litecoin"
            active={!isMwebAddress}
            onPress={() => {
              dispatch(getAddress(false));
              setIsMwebAddress(false);
            }}
          />
          <NewBlueButton
            textKey="receive_privately"
            textDomain="receiveTab"
            active={isMwebAddress}
            onPress={() => {
              dispatch(getAddress(true));
              setIsMwebAddress(true);
            }}
          />
        </View>

        <TranslateText
          textKey="my_ltc_address"
          domain="receiveTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.subtitleText}
        />

        <View style={styles.addressContainer}>
          <View style={styles.address}>
            <Pressable
              style={styles.pressableContainer}
              onPress={() => handleCopy()}>
              <TranslateText
                textValue={address}
                maxSizeInPixels={SCREEN_HEIGHT * 0.021}
                textStyle={styles.addressText}
              />
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

          <LoadingIndicator visible={loading} />
        </View>

        {isMwebAddress ? (
          <TranslateText
            textKey="recieve_mweb_description"
            domain="receiveTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.minText}
            numberOfLines={3}
          />
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
      height: 'auto',
    },
    address: {
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
