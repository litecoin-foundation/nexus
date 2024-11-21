import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import WhiteButton from '../Buttons/WhiteButton';
import WalletTab from '../Tabs/WalletTab';

import {useAppSelector} from '../../store/hooks';

interface Props {
  // currentWallet: string;
  isOpened: boolean;
  showAnim: boolean;
  animDelay: number;
  animDuration: number;
  cardTranslateAnim: any;
}

export default function WalletsModalContent(props: Props) {
  const {isOpened, showAnim, animDelay, animDuration, cardTranslateAnim} = props;
  // const navigation = useNavigation<any>();

  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

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
          animDelay + 100,
          withTiming(1, {duration: animDuration + 100}),
        );
      } else {
        buttonOpacity.value = 0;
      }
    }
  }, [animDelay, animDuration, buttonOpacity, isOpened, showAnim]);

  const wallets = (
    <>
      <Animated.View style={[styles.bodyItem, animatedButton]}>
        <WalletTab
          colorStyle="White"
          walletName="Main wallet"
          balance={2136.3}
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

  const onlineOfflineBgColor = isInternetReachable ? '#0d3d8a' : '#e06852';

  return (
    <Animated.View style={[
      styles.body,
      cardTranslateAnim,
      {backgroundColor: onlineOfflineBgColor},
    ]}>
      <View style={styles.bodyItems}>{wallets}</View>
      <Animated.View style={animatedButton}>
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

const styles = StyleSheet.create({
  body: {
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Dimensions.get('screen').height * 0.03,
  },
  bodyItems: {
    flex: 1,
    width: '100%',
  },
  bodyItem: {
    height: 'auto',
    width: '100%',
    marginBottom: Dimensions.get('screen').height * 0.03,
  },
  notificationTab: {
    height: Dimensions.get('screen').height * 0.1,
    width: '100%',
    borderRadius: Dimensions.get('screen').height * 0.02,
    borderWidth: 2,
    borderColor: 'red',
    borderStyle: 'dashed',
    backgroundColor: 'trasnparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'red',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.018,
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
