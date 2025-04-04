import React, {useEffect, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import WhiteClearButton from '../Buttons/WhiteClearButton';
import WalletTabSimple from '../Tabs/WalletTabSimple';
import {useAppSelector} from '../../store/hooks';
import {satsToSubunitSelector} from '../../reducers/settings';
import {fiatValueSelector} from '../../reducers/ticker';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isOpened: boolean;
  animDelay: number;
  animDuration: number;
  close(): void;
}

export default function WalletsInblockContent(props: Props) {
  const {isOpened, animDelay, animDuration, close} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const {t} = useTranslation('main');

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
    if (isOpened) {
      buttonOpacity.value = withDelay(
        animDelay + 100,
        withTiming(1, {duration: animDuration + 100}),
      );
    } else {
      buttonOpacity.value = 0;
    }
  }, [animDelay, animDuration, buttonOpacity, isOpened]);

  const wallets = (
    <>
      <Animated.View style={[styles.bodyItem, animatedButton]}>
        <WalletTabSimple
          colorStyle="White"
          walletName={t('main_wallet')}
          balance={balanceAmount}
          fiatBalance={fiatAmount}
          priceRate={65}
          prevRate={55}
        />
      </Animated.View>
      {/* <Animated.View style={[styles.bodyItem, animatedButton]}>
        <WalletTabSimple
          colorStyle="Blue"
          walletName="Online Payments Wallet"
          balance={3}
          priceRate={65}
          prevRate={55}
        />
      </Animated.View> */}
    </>
  );

  const onlineOfflineBgColor = isInternetReachable ? '#0d3d8a' : '#e06852';

  return isOpened ? (
    <Animated.View
      style={[styles.body, {backgroundColor: onlineOfflineBgColor}]}>
      <View style={styles.bodyItems}>{wallets}</View>
      <Animated.View style={animatedButton}>
        <WhiteClearButton small={true} value="Close" onPress={() => close()} />
      </Animated.View>
    </Animated.View>
  ) : (
    <></>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    body: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: screenHeight * 0.03,
      paddingBottom: screenHeight * 0.02,
    },
    bodyItems: {
      width: '100%',
      height: 'auto',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
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
    button: {
      height: 50,
      width: 150,
      borderRadius: 25,
      backgroundColor: 'white',
      shadowColor: '#393e53',
      shadowOpacity: 0.25,
      shadowRadius: 14,
    },
    noMargin: {
      margin: 0,
    },
  });
