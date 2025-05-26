import React, {useState, useContext} from 'react';
import {View, StyleSheet, Pressable, Image} from 'react-native';
import PriceIndicatorButton from '../Buttons/PriceIndictorButton';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import Clipboard from '@react-native-clipboard/clipboard';
import InfoModal from '../Modals/InfoModalContent';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {subunitCodeSelector} from '../../reducers/settings';

interface Props {
  colorStyle: string;
  walletName: string;
  balance: number;
  fiatBalance: number;
  chartPercentage: number;
  chartPercentageChange: string;
}

const WalletTab: React.FC<Props> = (props: Props) => {
  const {
    colorStyle,
    walletName,
    balance,
    fiatBalance,
    chartPercentage,
    chartPercentageChange,
  } = props;
  const dispatch = useAppDispatch();

  const amountCode = useAppSelector(state => subunitCodeSelector(state));

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

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isWhiteStyle);

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
      String(balance).length > 7 ? SCREEN_HEIGHT * 0.03 : SCREEN_HEIGHT * 0.04,
  };

  return (
    <View style={styles.walletTab}>
      <View style={styles.tabLeft}>
        <TranslateText
          textValue={walletName}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={styles.tabLeftTitle}
          numberOfLines={1}
        />
        <TranslateText
          textValue={String(balance + ' ' + amountCode)}
          maxSizeInPixels={SCREEN_HEIGHT * 0.03}
          textStyle={{...styles.tabLeftBalance, ...balanceTextSizeStyle}}
          numberOfLines={1}
        />
        <View style={styles.tabLeftWorthContainer}>
          <TranslateText
            textValue={String(fiatBalance)}
            maxSizeInPixels={SCREEN_HEIGHT * 0.017}
            textStyle={styles.tabLeftWorth}
            numberOfLines={1}
          />
          <PriceIndicatorButton value={Number(chartPercentage)} />
          <TranslateText
            textValue={String(chartPercentageChange)}
            maxSizeInPixels={SCREEN_HEIGHT * 0.017}
            textStyle={styles.tabLeftWorthChange}
            numberOfLines={1}
          />
        </View>
      </View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handleCopy}>
        <Animated.View style={[styles.tabRight, motionStyle]}>
          <Image source={require('../../assets/icons/copy-icon.png')} />
          <TranslateText
            textKey={'copy_address'}
            domain={'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.013}
            textStyle={styles.tabRightTitle}
            numberOfLines={2}
          />
        </Animated.View>
      </Pressable>

      <InfoModal
        isVisible={isInfoModalVisible}
        close={() => setInfoModalVisible(false)}
        textColor="green"
        textKey="copied"
        textDomain="main"
      />
    </View>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isWhiteStyle?: boolean,
) =>
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
      fontFamily: 'Satoshi Variable',
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
      // width: 57,
      paddingHorizontal: screenWidth * 0.02,
    },
  });

export default WalletTab;
