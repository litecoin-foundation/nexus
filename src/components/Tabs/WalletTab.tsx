import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import PriceIndicatorButton from '../Buttons/PriceIndictorButton';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import Clipboard from '@react-native-clipboard/clipboard';
import InfoModal from '../Modals/InfoModal';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  colorStyle: string;
  walletName: string;
  balance: number;
  fiatBalance: number;
  priceRate: number;
  prevRate: number;
}

const WalletTab: React.FC<Props> = (props: Props) => {
  const {colorStyle, walletName, balance, fiatBalance, priceRate, prevRate} =
    props;
  const dispatch = useAppDispatch();

  let isWhiteStyle = true;
  switch (colorStyle) {
    case 'White':
      isWhiteStyle = true;
      break;
    case 'Blue':
      isWhiteStyle = false;
      break;
    default:
      break;
  }

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isWhiteStyle);

  const change: any = (priceRate / prevRate) * 100 - 100;
  const changeText =
    change < 0 ? '' : '+' + parseFloat(change).toFixed(2) + '%';

  // animation
  const scaler = useSharedValue(1);

  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  // copy address handler
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const address = useAppSelector(state => state.address.address);
  const handleCopy = () => {
    dispatch(getAddress());
    setInfoModalVisible(true);
    Clipboard.setString(address);
  };

  const balanceTextSizeStyle = {
    fontSize:
      String(balance).length > 7
        ? SCREEN_HEIGHT * 0.03
        : SCREEN_HEIGHT * 0.04,
  };

  return (
    <View style={styles.walletTab}>
      <View style={styles.tabLeft}>
        <Text style={styles.tabLeftTitle}>{walletName}</Text>
        <Text
          style={[styles.tabLeftBalance, balanceTextSizeStyle]}>
          {balance + ' LTC'}
        </Text>
        <View style={styles.tabLeftWorthContainer}>
          <Text style={styles.tabLeftWorth}>{fiatBalance}</Text>
          <PriceIndicatorButton value={Number(change)} />
          <Text style={styles.tabLeftWorthChange}>
            {changeText}
          </Text>
        </View>
      </View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handleCopy}>
        <Animated.View style={[styles.tabRight, motionStyle]}>
          <Image source={require('../../assets/icons/copy-icon.png')} />
          <Text style={styles.tabRightTitle}>copy address</Text>
        </Animated.View>
      </Pressable>

      <InfoModal
        isVisible={isInfoModalVisible}
        close={() => setInfoModalVisible(false)}
        textColor="green"
        text="COPIED TO CLIPBOARD!"
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, isWhiteStyle?: boolean) =>
  StyleSheet.create({
    walletTab: {
      height: screenHeight * 0.14,
      minHeight: 100,
      width: '100%',
      borderRadius: screenHeight * 0.02,
      backgroundColor: isWhiteStyle ? '#fff' : '#193A72',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: screenHeight * 0.015,
    },
    tabLeft: {
      flexBasis: '75%',
      height: '90%',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    tabLeftTitle: {
      color: isWhiteStyle ? '#555' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: screenHeight * 0.018,
    },
    tabLeftBalance: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: screenHeight * 0.04,
      marginTop: screenHeight * 0.008 * -1,
    },
    tabLeftWorthContainer: {
      flexDirection: 'row',
      gap: screenHeight * 0.012,
    },
    tabLeftWorth: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.016,
    },
    tabLeftWorthChange: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.016,
    },
    tabRight: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: screenHeight * 0.09,
      minHeight: 84,
      minWidth: 74,
      borderRadius: screenHeight * 0.016,
      backgroundColor: isWhiteStyle ? '#eee' : '#061A39',
    },
    tabRightCopyIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
    },
    tabRightTitle: {
      color: isWhiteStyle ? '#000' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.012,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginTop: screenHeight * 0.01,
      width: 57,
    },
  });

export default WalletTab;
