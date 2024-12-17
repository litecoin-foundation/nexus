import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
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
        ? Dimensions.get('screen').height * 0.03
        : Dimensions.get('screen').height * 0.04,
  };

  return (
    <View style={styles(isWhiteStyle).walletTab}>
      <View style={styles(isWhiteStyle).tabLeft}>
        <Text style={styles(isWhiteStyle).tabLeftTitle}>{walletName}</Text>
        <Text
          style={[styles(isWhiteStyle).tabLeftBalance, balanceTextSizeStyle]}>
          {balance + ' LTC'}
        </Text>
        <View style={styles(isWhiteStyle).tabLeftWorthContainer}>
          <Text style={styles(isWhiteStyle).tabLeftWorth}>{fiatBalance}</Text>
          <PriceIndicatorButton value={Number(change)} />
          <Text style={styles(isWhiteStyle).tabLeftWorthChange}>
            {changeText}
          </Text>
        </View>
      </View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handleCopy}>
        <Animated.View style={[styles(isWhiteStyle).tabRight, motionStyle]}>
          <Image source={require('../../assets/icons/copy-icon.png')} />
          <Text style={styles(isWhiteStyle).tabRightTitle}>copy address</Text>
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

const styles = (isWhiteStyle?: boolean) =>
  StyleSheet.create({
    walletTab: {
      height: Dimensions.get('screen').height * 0.14,
      minHeight: 100,
      width: '100%',
      borderRadius: Dimensions.get('screen').height * 0.02,
      backgroundColor: isWhiteStyle ? '#fff' : '#193A72',
      flexDirection: 'row',
      alignItems: 'center',
      padding: Dimensions.get('screen').height * 0.015,
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
      fontSize: Dimensions.get('screen').height * 0.018,
    },
    tabLeftBalance: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontFamily:
        Platform.OS === 'ios'
          ? 'Satoshi Variable'
          : 'SatoshiVariable-Regular.ttf',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: Dimensions.get('screen').height * 0.04,
      marginTop: Dimensions.get('screen').height * 0.008 * -1,
    },
    tabLeftWorthContainer: {
      flexDirection: 'row',
      gap: Dimensions.get('screen').height * 0.012,
    },
    tabLeftWorth: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
    tabLeftWorthChange: {
      color: isWhiteStyle ? '#000' : '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.016,
    },
    tabRight: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: 94,
      minWidth: 80,
      borderRadius: Dimensions.get('screen').height * 0.016,
      backgroundColor: isWhiteStyle ? '#eee' : '#061A39',
    },
    tabRightCopyIcon: {
      height: Dimensions.get('screen').height * 0.035,
      width: Dimensions.get('screen').height * 0.035,
    },
    tabRightTitle: {
      color: isWhiteStyle ? '#000' : '#ddd',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: Dimensions.get('screen').height * 0.012,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginTop: Dimensions.get('screen').height * 0.01,
      width: 57,
    },
  });

export default WalletTab;
