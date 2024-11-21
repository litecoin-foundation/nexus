import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {
  Canvas,
  RoundedRect,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import {getTransactions, txDetailSelector} from '../reducers/transaction';
import HeaderButton from '../components/Buttons/HeaderButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import Buy from '../components/Cards/Buy';
import Sell from '../components/Cards/Sell';
import PlasmaModal from './../components/Modals/PlasmaModal';
import WalletsModalContent from './../components/Modals/WalletsModalContent';
import TxDetailModalContent from './../components/Modals/TxDetailModalContent';
import {groupTransactions} from '../lib/utils/groupTransactions';
import {NativeStackScreenProps} from 'react-native-screens/lib/typescript/native-stack/types';
import BottomSheet from '../components/BottomSheet';
import TransactionList from '../components/TransactionList';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';
import {decodeBIP21} from '../lib/utils/bip21';
import {unsetDeeplink} from '../reducers/deeplinks';
import {validate as validateLtcAddress} from '../lib/utils/validate';
import {updateAmount} from '../reducers/input';
import SendModal from '../components/Modals/SendModal';
import DatePicker from '../components/DatePicker';

const fontFamily =
  Platform.OS === 'ios' ? 'Satoshi Variable' : 'SatoshiVariable-Regular.ttf';
const fontStyle = {
  fontFamily,
  fontStyle: 'normal',
  fontWeight: '700',
};
const font = matchFont(fontStyle);

const SNAP_POINTS_FROM_TOP = [240, Dimensions.get('screen').height * 0.47];
const OPEN_SNAP_POINT = SNAP_POINTS_FROM_TOP[0];
const CLOSED_SNAP_POINT = SNAP_POINTS_FROM_TOP[SNAP_POINTS_FROM_TOP.length - 1];

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
  SearchTransaction: undefined;
};

interface Props extends NativeStackScreenProps<RootStackParamList, 'Main'> {}

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;
  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks);
  const groupedTransactions = groupTransactions(transactions);

  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(0);
  const [isSendModalTriggered, triggerSendModal] = useState<boolean>(false);
  const [selectedTransaction, selectTransaction] = useState(null);
  const [displayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
  const [currentWallet, setCurrentWallet] = useState('Main wallet');

  // Deeplink handler
  useEffect(() => {
    if (deeplinkSet) {
      validate(uri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deeplink validator
  const validate = async data => {
    try {
      // handle BIP21 litecoin URI
      if (data.startsWith('litecoin:')) {
        const decoded = decodeBIP21(data);
        const valid = await validateLtcAddress(decoded.address);

        // BIP21 validation
        if (!valid) {
          throw new Error('URI');
        }

        // If additional data included, set amount/address
        if (decoded.options.amount) {
          // setAmount(decoded.options.amount);
          dispatch(updateAmount(decoded.options.amount));
        }
        if (decoded.options.message) {
          // setDescription(decoded.options.message);
        }
        // setAddress(decoded.address);

        return;
      }
    } catch (error) {
      throw new Error(String(error));
    }
  };

  // Deeplink payment logic
  const handleConfirmSend: () => void = async () => {
    try {
      // await dispatch(sendOnchainPayment(address, amount));
      // dispatch(unsetDeeplink());
      // triggerSendModal(false);
      // navigation.navigate('Sent', {amount, address});
    } catch (error: unknown) {
      Alert.alert('Payment Failed', String(error));
      return;
    }
  };

  // Animation
  const translationY = useSharedValue(0);
  const bottomSheetTranslateY = useSharedValue(CLOSED_SNAP_POINT);
  const scrollOffset = useSharedValue(0);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(OPEN_SNAP_POINT, translateY);
    const clampedTranslateY = Math.min(CLOSED_SNAP_POINT, minTranslateY);
    return {
      opacity: interpolate(
        clampedTranslateY,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, 1],
      ),
    };
  });

  const animatedHeaderHeight = useAnimatedProps(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(OPEN_SNAP_POINT, translateY);
    const clampedTranslateY = Math.min(CLOSED_SNAP_POINT, minTranslateY);
    return {
      height: clampedTranslateY,
      borderBottomLeftRadius: interpolate(
        clampedTranslateY,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, 40],
      ),
      borderBottomRightRadius: interpolate(
        clampedTranslateY,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [1, 40],
      ),
    };
  });

  const animatedHeaderContainerBackground = useAnimatedStyle(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(OPEN_SNAP_POINT, translateY);
    const clampedTranslateY = Math.min(CLOSED_SNAP_POINT, minTranslateY);
    return {
      backgroundColor: interpolateColor(
        clampedTranslateY,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [isInternetReachable ? '#1162E6' : '#F36F56', '#f7f7f7'],
      ),
    };
  });

  const shrinkHeaderOnButtonPress = () => {
    translationY.value = withSpring(-300, {mass: 0.5});
  };

  const expandHeaderOnButtonPress = () => {
    translationY.value = withSpring(-12, {mass: 0.5});
  };

  useEffect(() => {
    dispatch(getTransactions());
  }, []);

  // change headerLeft button based on if card is open
  // if transaction list is shown, show settings button
  // if < arrow shown, pressing closes the active card
  useEffect(() => {
    const navigationBarPress = (
      <HeaderButton
        onPress={() => {
          expandHeaderOnButtonPress();
          setActiveTab(0);
        }}
        imageSource={require('../assets/images/back-icon.png')}
      />
    );
    if (activeTab !== 0) {
      navigation.setOptions({
        headerLeft: () => navigationBarPress,
      });
    } else {
      navigation.setOptions({
        headerLeft: () => (
          <HeaderButton
            onPress={() => navigation.navigate('SettingsStack')}
            imageSource={require('../assets/icons/settings-cog.png')}
          />
        ),
      });
    }
  }, [activeTab, expandHeaderOnButtonPress, navigation]);

  const [plasmaModalGapInPixels, setPlasmaModalGapInPixels] = useState(0);

  const buttonOpacity = useSharedValue(0);
  const walletButtonOpacity = useSharedValue(0);

  const animatedButton = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    };
  });

  const animatedWalletButton = useAnimatedStyle(() => {
    return {
      opacity: walletButtonOpacity.value,
    };
  });

  const leftHeaderButton = useMemo(
    () => (
      <Animated.View style={[{width: 'auto', height: 'auto'}, animatedButton]}>
        <HeaderButton
          onPress={() => navigation.navigate('SettingsStack')}
          imageSource={require('../assets/icons/settings-cog.png')}
        />
      </Animated.View>
    ),
    [animatedButton, navigation],
  );

  const rightHeaderButton = useMemo(
    () => (
      <Animated.View style={[{width: 'auto', height: 'auto'}, animatedButton]}>
        <HeaderButton
          onPress={() => navigation.navigate('AlertsStack')}
          imageSource={require('../assets/icons/charts-icon.png')}
          rightPadding={true}
        />
      </Animated.View>
    ),
    [animatedButton, navigation],
  );

  const walletButton = useMemo(
    () => (
      <Animated.View
        style={[{width: 'auto', height: 'auto'}, animatedWalletButton]}
        onLayout={event => {
          event.target.measure((x, y, width, height, pageX, pageY) => {
            setPlasmaModalGapInPixels(height + pageY);
          });
        }}>
        <ChooseWalletButton
          title={currentWallet}
          onPress={() => {
            setWalletsModalOpened(!isWalletsModalOpened);
          }}
          disabled={false}
          isModalOpened={isWalletsModalOpened}
          isFromBottomToTop={false}
          animDuration={200}
        />
      </Animated.View>
    ),
    [animatedWalletButton, currentWallet, isWalletsModalOpened],
  );

  useEffect(() => {
    if (isWalletsModalOpened || isTxDetailModalOpened) {
      buttonOpacity.value = withTiming(0, {duration: 150});

      var fadingTimeout = setTimeout(() => {
        navigation.setOptions({
          headerLeft: undefined,
          headerRight: undefined,
        });
      }, 150);
    } else {
      buttonOpacity.value = withDelay(150, withTiming(1, {duration: 250}));

      navigation.setOptions({
        headerLeft: () => leftHeaderButton,
        headerRight: () => rightHeaderButton,
      });
    }

    if (isTxDetailModalOpened) {
      walletButtonOpacity.value = withTiming(0, {duration: 150});

      var walletButtonFadingTimeout = setTimeout(() => {
        navigation.setOptions({
          headerTitle: () => <></>,
        });
      }, 150);
    } else {
      walletButtonOpacity.value = withDelay(
        150,
        withTiming(1, {duration: 250}),
      );

      navigation.setOptions({
        headerTitle: () => walletButton,
      });
    }

    return () => {
      clearTimeout(fadingTimeout);
      clearTimeout(walletButtonFadingTimeout);
    };
  }, [
    leftHeaderButton,
    rightHeaderButton,
    walletButton,
    navigation,
    isWalletsModalOpened,
    isTxDetailModalOpened,
    buttonOpacity,
    walletButtonOpacity,
  ]);

  const txListComponent = (
    <View>
      <View style={styles.txTitleContainer}>
        <Text style={styles.txTitleText}>Latest Transactions</Text>

        <Pressable onPress={() => navigation.navigate('SearchTransaction')}>
          <Canvas style={{height: 50, width: 80}}>
            <RoundedRect
              x={0}
              y={0}
              width={90}
              height={50}
              color="white"
              r={10}
            />
            <SkiaText x={10} y={16} text="All" font={font} color={'#2E2E2E'} />
          </Canvas>
        </Pressable>
      </View>
      <TransactionList
        scrollOffset={scrollOffset}
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
        transactions={displayedTxs}
      />
    </View>
  );

  const HeaderComponent = (
    <View style={styles.headerContainer}>
      <DashboardButton
        title="Buy"
        imageSource={require('../assets/icons/buy-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(1);
        }}
        active={activeTab === 1}
        textPadding={28}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Sell"
        imageSource={require('../assets/icons/sell-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(2);
        }}
        active={activeTab === 2}
        textPadding={30}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Convert"
        imageSource={require('../assets/icons/convert-icon.png')}
        handlePress={() => {
          console.log('nothing to do');
        }}
        active={activeTab === 3}
        textPadding={18}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Send"
        imageSource={require('../assets/icons/send-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(4);
        }}
        active={activeTab === 4}
        textPadding={25}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Receive"
        imageSource={require('../assets/icons/receive-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(5);
        }}
        active={activeTab === 5}
        textPadding={18}
        disabled={false}
      />
    </View>
  );

  return (
    <Animated.View
      style={[styles.container, animatedHeaderContainerBackground]}>
      <NewAmountView
        animatedProps={animatedHeaderHeight}
        currentWallet={currentWallet}
        openWallets={() => {
          setWalletsModalOpened(true);
        }}>
        <Animated.View style={animatedHeaderStyle}>
          <LineChart />
          <DatePicker />
        </Animated.View>
      </NewAmountView>

      <BottomSheet
        headerComponent={HeaderComponent}
        translationY={translationY}
        bottomSheetTranslateY={bottomSheetTranslateY}
        scrollOffset={scrollOffset}
        handleSwipeDown={() => setActiveTab(0)}
        activeTab={activeTab}
        txViewComponent={txListComponent}
        buyViewComponent={<Buy route={route} />}
        sellViewComponent={<Sell route={route} />}
        sendViewComponent={<Send route={route} />}
        receiveViewComponent={<Receive />}
      />

      <PlasmaModal
        isOpened={isTxDetailModalOpened}
        close={() => {
          setTxDetailModalOpened(false);
        }}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={200}
        backSpecifiedStyle={{backgroundColor: 'rgba(17, 74, 175, 0.8)'}}
        gapSpecifiedStyle={{backgroundColor: 'transparent'}}
        contentBodySpecifiedStyle={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        renderBody={(
          isOpened: boolean,
          showAnim: boolean,
          animDelay: number,
          animDuration: number,
        ) => (
          <TxDetailModalContent
            isOpened={isOpened}
            close={() => {
              setTxDetailModalOpened(false);
            }}
            showAnim={showAnim}
            animDelay={animDelay}
            animDuration={animDuration}
            transaction={selectedTransaction}
          />
        )}
      />

      <PlasmaModal
        isOpened={isWalletsModalOpened}
        close={() => {
          setWalletsModalOpened(false);
        }}
        isFromBottomToTop={false}
        animDuration={250}
        gapInPixels={plasmaModalGapInPixels}
        backSpecifiedStyle={{backgroundColor: 'transparent'}}
        renderBody={(
          isOpened: boolean,
          showAnim: boolean,
          animDelay: number,
          animDuration: number,
        ) => (
          <WalletsModalContent
            isOpened={isOpened}
            showAnim={showAnim}
            animDelay={animDelay}
            animDuration={animDuration}
          />
        )}
      />

      <SendModal
        isVisible={isSendModalTriggered}
        handleConfirm={() => handleConfirmSend()}
        close={() => {
          triggerSendModal(false);
          dispatch(unsetDeeplink());
        }}
        amount={32}
        address={'fdsfdsfdsfds'}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flexGrow: 1,
    alignSelf: 'stretch',
    marginTop: 25,
    bottom: 0,
  },
  headerContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  txTitleContainer: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txTitleText: {
    paddingLeft: 19,
    paddingBottom: 12,
    paddingTop: 5,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 24,
  },
});

export const navigationOptions = (navigation: any) => {
  return {
    headerTitle: () => (
      <ChooseWalletButton
        title={'Wallet Title'}
        onPress={() => {}}
        disabled={false}
        isModalOpened={false}
        isFromBottomToTop={false}
        animDuration={200}
      />
    ),
    headerTransparent: true,
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.navigate('SettingsStack')}
        imageSource={require('../assets/icons/settings-cog.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        onPress={() => navigation.navigate('AlertsStack')}
        imageSource={require('../assets/icons/charts-icon.png')}
        rightPadding={true}
      />
    ),
  };
};

export default Main;
