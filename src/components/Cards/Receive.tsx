import React, {useEffect, useRef, useState, useContext} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import {WalletState} from 'react-native-nitro-lndltc';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  getAddress,
  setRegularAddressAddress,
  setMWEBAddressAddress,
} from '../../reducers/address';
import NewButton from '../Buttons/NewButton';
import SegmentedPills, {Segment} from '../ButtonsV2/SegmentedPills';
import InfoModal from '../Modals/InfoModalContent';
import LoadingIndicator from '../../components/LoadingIndicator';
import SkeletonLines from '../../components/SkeletonLines';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PADDING_RATIO, TITLE_ROW_HEIGHT_RATIO} from './cardLayout';

// index 0 regular address, 1 mweb
const ADDRESS_TYPES: Segment[] = [
  {key: 'litecoin', textKey: 'regular_ltc', textDomain: 'receiveTab'},
  {key: 'mweb', textKey: 'private_ltc', textDomain: 'receiveTab'},
];

// switching between two known addresses: the old one slides out away from
// the selected pill, the new one slides in from its side
const SWAP_OUT = {duration: 140, easing: Easing.in(Easing.quad)};
const SWAP_IN = {duration: 240, easing: Easing.bezier(0.22, 1, 0.36, 1)};
const SWAP_SHIFT_RATIO = 0.05;

interface Props {
  containerHeight: number;
}

const Receive: React.FC<Props> = ({containerHeight}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {address, regularAddress, mwebAddress} = useAppSelector(
    state => state.address!,
  );
  const walletState = useAppSelector(state => state.lightning!.walletState);
  // NOTE: lndActive flips true the moment LND is up in any state (NON_EXISTING /
  // LOCKED / UNLOCKED), long before the RPC that serves newAddress exists, and
  // it never toggles again — so gating on it fires getAddress once, too early,
  // and never retries. Wait for the wallet RPC to actually be servable instead.
  const rpcReady =
    walletState === WalletState.RPC_ACTIVE ||
    walletState === WalletState.SERVER_ACTIVE;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const [regularAddressState, setRegularAddressState] =
    useState(regularAddress);
  const [mwebAddressState, setMwebAddressState] = useState(mwebAddress);
  const [isMwebAddress, setIsMwebAddress] = useState(false);
  const selectedAddress = isMwebAddress
    ? mwebAddressState
    : regularAddressState;
  const [shown, setShown] = useState({
    mweb: isMwebAddress,
    address: selectedAddress,
  });
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);

  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    shown.address.length,
    containerHeight,
  );
  const [loading, setLoading] = useState(
    regularAddress && mwebAddress ? false : true,
  );

  // generate fresh new address on launch
  useEffect(() => {
    // check if RPC is ready for new address
    if (rpcReady) {
      dispatch(getAddress());
    } else {
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpcReady]);

  // update qr code when address changes
  useEffect(() => {
    if (isMwebAddress && address.includes('ltcmweb')) {
      setMwebAddressState(address);
      dispatch(setMWEBAddressAddress(address));
    } else if (!isMwebAddress && !address.includes('ltcmweb')) {
      setRegularAddressState(address);
      dispatch(setRegularAddressAddress(address));
    }
  }, [address, isMwebAddress, dispatch]);

  // NOTE: Both addresses known: the old one slides out, the new one is rendered at
  // the midpoint and slides in. A fresh address of the same type (the tap
  // also asks lnd for one) crossfades in place. An address not loaded yet
  // swaps straight to the skeleton.
  const contentOpacity = useSharedValue(1);
  const contentShift = useSharedValue(0);
  // the side the next address enters from, set at a switch's midpoint
  const enterFrom = useRef(0);
  useEffect(() => {
    const shift = SCREEN_WIDTH * SWAP_SHIFT_RATIO;
    if (shown.mweb === isMwebAddress && shown.address === selectedAddress) {
      // swapped at the midpoint, or a switch reversed before reaching it
      if (enterFrom.current) {
        contentShift.value = enterFrom.current * shift;
        enterFrom.current = 0;
      }
      contentOpacity.value = withTiming(1, SWAP_IN);
      contentShift.value = withTiming(0, SWAP_IN);
      return;
    }
    const next = {mweb: isMwebAddress, address: selectedAddress};
    if (!shown.address || !selectedAddress) {
      cancelAnimation(contentOpacity);
      cancelAnimation(contentShift);
      contentOpacity.value = 1;
      contentShift.value = 0;
      enterFrom.current = 0;
      setShown(next);
      return;
    }
    const direction = shown.mweb === isMwebAddress ? 0 : isMwebAddress ? 1 : -1;
    const swap = () => {
      enterFrom.current = direction;
      setShown(next);
    };
    contentShift.value = withTiming(-direction * shift, SWAP_OUT);
    contentOpacity.value = withTiming(0, SWAP_OUT, finished => {
      if (finished) {
        runOnJS(swap)();
      }
    });
  }, [
    isMwebAddress,
    selectedAddress,
    shown,
    SCREEN_WIDTH,
    contentOpacity,
    contentShift,
  ]);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{translateX: contentShift.value}],
  }));

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

  // the shown address, not the store's latest
  const handleCopy = async () => {
    setInfoModalVisible(true);
    Clipboard.setString(shown.address);
  };

  const handleShare = () => {
    Share.open({message: shown.address});
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <TranslateText
            textKey="receive_ltc"
            domain="receiveTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.025}
            textStyle={styles.titleText}
            numberOfLines={1}
          />
        </View>

        <View style={styles.txTypeContainer}>
          <SegmentedPills
            segments={ADDRESS_TYPES}
            activeIndex={isMwebAddress ? 1 : 0}
            onSelect={index => {
              const mweb = index === 1;
              dispatch(getAddress(mweb));
              setIsMwebAddress(mweb);
            }}
            width={SCREEN_WIDTH * (1 - PADDING_RATIO * 2)}
            tone="light"
          />
        </View>

        <TranslateText
          textKey="my_ltc_address"
          domain="receiveTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={styles.subtitleText}
        />

        <Animated.View style={contentStyle}>
          <View style={styles.addressContainer}>
            {!loading ? (
              <View style={styles.address}>
                <Pressable
                  style={styles.pressableContainer}
                  onPress={() => handleCopy()}>
                  <TranslateText
                    textValue={shown.address}
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
                numberOfLines={shown.mweb ? 3 : 1}
                shortLastLine
                lineHeight={SCREEN_HEIGHT * 0.022}
                lineGap={SCREEN_HEIGHT * 0.01}
              />
            )}

            <View style={styles.qrContainer}>
              {!loading && shown.address ? (
                <QRCode
                  value={shown.address}
                  size={
                    shown.mweb
                      ? SCREEN_HEIGHT * 0.22 - insets.bottom
                      : SCREEN_HEIGHT * 0.27 - insets.bottom
                  }
                  color="#000"
                  backgroundColor="#fff"
                />
              ) : (
                <View
                  style={[
                    styles.qrSkeleton,
                    {
                      height: shown.mweb
                        ? SCREEN_HEIGHT * 0.22 - insets.bottom
                        : SCREEN_HEIGHT * 0.27 - insets.bottom,
                    },
                  ]}
                />
              )}

              <LoadingIndicator visible={loading} noBlur tinted />
            </View>
          </View>

          {shown.mweb ? (
            <TranslateText
              textKey="receive_mweb_description"
              domain="receiveTab"
              maxSizeInPixels={SCREEN_HEIGHT * 0.015}
              textStyle={styles.minText}
              numberOfLines={3}
            />
          ) : null}
        </Animated.View>
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
  containerHeight: number,
) =>
  StyleSheet.create({
    container: {
      height: containerHeight,
      backgroundColor: '#f7f7f7',
      paddingTop: screenWidth * PADDING_RATIO,
      paddingHorizontal: screenWidth * PADDING_RATIO,
    },
    titleRow: {
      height: screenHeight * TITLE_ROW_HEIGHT_RATIO,
      justifyContent: 'center',
    },
    titleText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.025,
    },
    txTypeContainer: {
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
