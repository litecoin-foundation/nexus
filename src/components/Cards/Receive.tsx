import React, {useEffect, useState, useContext} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
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

  const [regularAddress, setRegularAddress] = useState('');
  const [mwebAddress, setMwebAddress] = useState('');
  const [isMwebAddress, setIsMwebAddress] = useState(false);
  const [uri, setURI] = useState('');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const shimmerValue = useSharedValue(0);
  const shimmerValue2 = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue.value,
      [0, 1],
      ['rgba(244, 244, 244, 0.6)', 'rgba(200, 200, 200, 0.9)'],
    );

    return {
      backgroundColor,
      transform: [
        {
          translateX: shimmerValue.value * SCREEN_WIDTH,
        },
      ],
    };
  });
  const animatedStyle2 = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue2.value,
      [0, 1],
      ['rgba(244, 244, 244, 0.6)', 'rgba(200, 200, 200, 0.9)'],
    );

    return {
      backgroundColor,
      transform: [
        {
          translateX: shimmerValue2.value * SCREEN_WIDTH * 0.7,
        },
      ],
    };
  });

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withDelay(
        500,
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
    shimmerValue2.value = withDelay(
      500,
      withRepeat(
        withDelay(
          500,
          withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [shimmerValue, shimmerValue2]);

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
      setMwebAddress(address);
      setURI(address);
    } else if (!isMwebAddress && !address.includes('ltcmweb')) {
      setRegularAddress(address);
      setURI(address);
    }
  }, [address, isMwebAddress]);

  // handle loading indicator
  useEffect(() => {
    if (isMwebAddress && !mwebAddress) {
      setLoading(true);
    }
    if (!isMwebAddress && !regularAddress) {
      setLoading(true);
    }
    var timeout = setTimeout(() => {
      if (isMwebAddress) {
        setLoading(mwebAddress ? false : true);
      } else {
        setLoading(regularAddress ? false : true);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [regularAddress, mwebAddress, isMwebAddress]);

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
                  textValue={isMwebAddress ? mwebAddress : regularAddress}
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
            <>
              <View style={styles.skeleton}>
                <Animated.View
                  style={[styles.animatedSkeleton, animatedStyle]}
                />
              </View>
              <View style={[styles.skeleton, styles.skeleton2]}>
                <Animated.View
                  style={[styles.animatedSkeleton, animatedStyle2]}
                />
              </View>
            </>
          )}

          <View style={styles.qrContainer}>
            {uri ? (
              <QRCode
                value={uri}
                size={
                  isMwebAddress ? SCREEN_HEIGHT * 0.18 : SCREEN_HEIGHT * 0.25
                }
              />
            ) : null}

            <LoadingIndicator visible={loading} />
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
    skeleton: {
      width: '100%',
      height: screenHeight * 0.022,
      borderRadius: 3,
      backgroundColor: '#F4F4F4',
      overflow: 'hidden',
      marginTop: screenHeight * 0.01,
    },
    skeleton2: {
      width: '70%',
    },
    animatedSkeleton: {
      width: '100%',
      height: '100%',
    },
  });

export default Receive;
