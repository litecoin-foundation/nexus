import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  getAddress,
  setRegularAddressAddress,
  setMWEBAddressAddress,
} from '../../reducers/address';
import NewBlueButton from '../Buttons/NewBlueButton';
import NewButton from '../Buttons/NewButton';
import InfoModal from '../Modals/InfoModalContent';
import LoadingIndicator from '../../components/LoadingIndicator';
import SkeletonLines from '../../components/SkeletonLines';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Receive: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {address, regularAddress, mwebAddress} = useAppSelector(
    state => state.address!,
  );
  const lndActive = useAppSelector(state => state.lightning!.lndActive);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, address.length);

  const [regularAddressState, setRegularAddressState] =
    useState(regularAddress);
  const [mwebAddressState, setMwebAddressState] = useState(mwebAddress);
  const [isMwebAddress, setIsMwebAddress] = useState(false);
  const [uri, setURI] = useState('');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const [loading, setLoading] = useState(
    regularAddress && mwebAddress ? false : true,
  );

  // generate fresh new address on launch
  useEffect(() => {
    // check if RPC is ready for new address
    if (lndActive) {
      dispatch(getAddress());
    } else {
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lndActive]);

  // update qr code when address changes
  useEffect(() => {
    if (isMwebAddress && address.includes('ltcmweb')) {
      setMwebAddressState(address);
      dispatch(setMWEBAddressAddress(address));
      setURI(address);
    } else if (!isMwebAddress && !address.includes('ltcmweb')) {
      setRegularAddressState(address);
      dispatch(setRegularAddressAddress(address));
      setURI(address);
    }
  }, [address, isMwebAddress, dispatch]);

  // handle loading indicator
  useEffect(() => {
    if (isMwebAddress && !mwebAddressState) {
      setLoading(true);
    }
    if (!isMwebAddress && !regularAddressState) {
      setLoading(true);
    }
    var timeout = setTimeout(() => {
      if (isMwebAddress) {
        setLoading(mwebAddressState ? false : true);
      } else {
        setLoading(regularAddressState ? false : true);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [regularAddressState, mwebAddressState, isMwebAddress]);

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
          {!loading ? (
            <View style={styles.address}>
              <Pressable
                style={styles.pressableContainer}
                onPress={() => handleCopy()}>
                <TranslateText
                  textValue={
                    isMwebAddress ? mwebAddressState : regularAddressState
                  }
                  maxSizeInPixels={SCREEN_HEIGHT * 0.021}
                  textStyle={styles.addressText}
                />
              </Pressable>

              <NewButton
                onPress={() => handleShare()}
                imageSource={require('../../assets/icons/share-icon.png')}
              />
            </View>
          ) : (
            <SkeletonLines
              numberOfLines={isMwebAddress ? 3 : 1}
              shortLastLine
              lineHeight={SCREEN_HEIGHT * 0.022}
              lineGap={SCREEN_HEIGHT * 0.01}
            />
          )}

          <View style={styles.qrContainer}>
            {!loading && uri ? (
              <QRCode
                value={uri}
                size={
                  isMwebAddress
                    ? SCREEN_HEIGHT * 0.22 - insets.bottom
                    : SCREEN_HEIGHT * 0.27 - insets.bottom
                }
              />
            ) : (
              <View
                style={[
                  styles.qrSkeleton,
                  {
                    height: isMwebAddress
                      ? SCREEN_HEIGHT * 0.22 - insets.bottom
                      : SCREEN_HEIGHT * 0.27 - insets.bottom,
                  },
                ]}
              />
            )}

            <LoadingIndicator visible={loading} noBlur tinted />
          </View>
        </View>

        {isMwebAddress ? (
          <TranslateText
            textKey="receive_mweb_description"
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
      paddingVertical: screenHeight * 0.02,
      overflow: 'hidden',
    },
    qrSkeleton: {
      width: '100%',
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
