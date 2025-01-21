import React, {useEffect, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import WhiteButton from '../Buttons/WhiteButton';
import WalletTab from '../Tabs/WalletTab';
import {useAppSelector} from '../../store/hooks';
import {satsToSubunitSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isOpened: boolean;
  showAnim: boolean;
  animDelay: number;
  animDuration: number;
  cardTranslateAnim: any;
}

export default function WalletsModalContent(props: Props) {
  const {isOpened, showAnim, animDelay, animDuration, cardTranslateAnim} =
    props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const balanceAmount = convertToSubunit(totalBalance);

  const calculateFiatAmount = useAppSelector(state => fiatValueSelector(state));
  const fiatAmount = calculateFiatAmount(totalBalance);
  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  // animation
  const buttonOpacity = useSharedValue(0);

  const animatedButton = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    };
  });

  useEffect(() => {
    if (showAnim) {
      if (isOpened) {
        buttonOpacity.value = withDelay(
          animDelay,
          withTiming(1, {duration: animDuration}),
        );
      } else {
        buttonOpacity.value = withTiming(0, {duration: animDuration});
      }
    }
  }, [animDelay, animDuration, buttonOpacity, isOpened, showAnim]);

  const wallets = (
    <>
      <Animated.View style={[styles.bodyItem, animatedButton]}>
        <WalletTab
          colorStyle="White"
          walletName="Main Wallet"
          balance={balanceAmount}
          fiatBalance={fiatAmount}
          priceRate={65}
          prevRate={55}
        />
      </Animated.View>
      {/* <Animated.View style={[styles.bodyItem, animatedButton]}>
        <WalletTab
          colorStyle="Blue"
          walletName="Online Payments Wallet"
          balance={3}
          priceRate={65}
          prevRate={55}
        />
      </Animated.View> */}
    </>
  );

  const onlineOfflineBgColor = isInternetReachable
    ? 'rgba(14,31,60,0.92)'
    : 'rgba(224,104,82,0.7)';

  return (
    <Animated.View
      style={[
        styles.body,
        cardTranslateAnim,
        {backgroundColor: onlineOfflineBgColor},
      ]}>
      <View style={styles.bodyItems}>{wallets}</View>
      <Animated.View style={[styles.buttonContainer, animatedButton]}>
        <WhiteButton
          value="ADD A NEW WALLET"
          onPress={() => {}}
          disabled={true}
          small={false}
          active={true}
        />
      </Animated.View>
    </Animated.View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    body: {
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: screenHeight * 0.03,
    },
    bodyItems: {
      flex: 1,
      width: '100%',
    },
    bodyItem: {
      height: 'auto',
      width: '100%',
      marginBottom: screenHeight * 0.03,
    },
    notificationTab: {
      height: screenHeight * 0.1,
      width: '100%',
      borderRadius: screenHeight * 0.02,
      borderWidth: 2,
      borderColor: 'red',
      borderStyle: 'dashed',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationText: {
      color: 'red',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: screenHeight * 0.018,
    },
    buttonContainer: {
      width: '100%',
    },
  });
