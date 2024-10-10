import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
// import {useNavigation} from '@react-navigation/native';

import WhiteButton from '../Buttons/WhiteButton';
import WalletTab from '../Tabs/WalletTab';

interface Props {
  currentWallet: string,
  isOpened: boolean,
  showAnim: boolean,
  animDelay: number,
  animDuration: number,
}

export default function WalletsModalContent(props:Props) {
  const {currentWallet, isOpened, showAnim, animDelay, animDuration} = props;
  // const navigation = useNavigation<any>();

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
      height: Dimensions.get('screen').height * 0.10,
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

  const buttonScale = useSharedValue(0.3);
  const buttonOpacity = useSharedValue(0);

  const animatedButtonScale = useAnimatedStyle(() => {
    return {
      transform: [{scale: buttonScale.value}],
      opacity: buttonOpacity.value,
    };
  });

  useEffect(() => {
    if(showAnim) {
      if (isOpened) {
        buttonScale.value = withDelay(animDelay, withTiming(1,  { duration: animDuration }));
        buttonOpacity.value = withDelay(animDelay, withTiming(1,  { duration: animDuration }));
      } else {
        buttonOpacity.value = 0;
      }
    }
  }, [isOpened, showAnim]);

  const wallets = (
    <>
      <Animated.View style={[styles.bodyItem, animatedButtonScale]}>
        <WalletTab colorStyle="White" walletName="Main wallet" balance={2136.3} priceRate={65} prevRate={55} />
      </Animated.View>
      <Animated.View style={[styles.bodyItem, animatedButtonScale]}>
        <View style={styles.notificationTab}>
          <Text style={styles.notificationText}>
            Hardware Wallet support coming soon
          </Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.bodyItem, animatedButtonScale]}>
        <WalletTab colorStyle="Blue" walletName="Online Payments Wallet" balance={3} priceRate={65} prevRate={55} />
      </Animated.View>
      <Animated.View style={[styles.bodyItem, animatedButtonScale]}>
        <WalletTab colorStyle="Blue" walletName="Test Wallet" balance={1} priceRate={65} prevRate={55} />
      </Animated.View>
    </>
  );

  return (
    <View style={styles.body}>
      <View style={styles.bodyItems}>
        {wallets}
      </View>
      <Animated.View style={animatedButtonScale}>
        <WhiteButton
          value="ADD A NEW WALLET"
          onPress={() => {}}
          disabled={true}
          small={false}
          active={true}
        />
      </Animated.View>
    </View>
  );
}
