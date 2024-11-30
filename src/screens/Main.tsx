import React, {useEffect, useState, useRef, useMemo} from 'react';
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
  // concat,
} from 'react-native-reanimated';
import {
  Canvas,
  Image,
  RoundedRect,
  matchFont,
  useImage,
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

const UNFOLD_SHEET_POINT = Dimensions.get('screen').height * 0.24;
const FOLD_SHEET_POINT = Dimensions.get('screen').height * 0.47;
const SNAP_POINTS_FROM_TOP = [
  Dimensions.get('screen').height * 0.24,
  Dimensions.get('screen').height * 0.47,
];
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
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [displayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
  const [currentWallet, setCurrentWallet] = useState('Main Wallet');

  const image = useImage(require('../assets/icons/search-icon.png'));

  function setTransactionIndex(newTxIndex: number) {
    selectTransaction(transactions[newTxIndex]);
  }

  function swipeToPrevTx() {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('index')) {
        const newTxIndex =
          selectedTransaction.index > 0
            ? selectedTransaction.index - 1
            : transactions.length - 1;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }

  function swipeToNextTx() {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('index')) {
        const newTxIndex =
          selectedTransaction.index < transactions.length - 1
            ? selectedTransaction.index + 1
            : 0;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }

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
        const valid = validateLtcAddress(decoded.address);

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
  const mainSheetsTranslationY = useSharedValue(0);
  const mainSheetsTranslationYStart = useSharedValue(0);
  const [isBottomSheetFolded, setBottomSheetFolded] = useState(true);
  function foldUnfoldBottomSheet(isFolded: boolean) {
    if (isFolded) {
      setBottomSheetFolded(false);
    } else {
      setBottomSheetFolded(true);
      setActiveTab(0);
    }
  }

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, 1],
      ),
    };
  });

  const animatedHeaderHeight = useAnimatedProps(() => {
    return {
      height: mainSheetsTranslationY.value,
      borderBottomLeftRadius: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [0, 40],
      ),
      borderBottomRightRadius: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [1, 40],
      ),
    };
  });

  const animatedHeaderContainerBackground = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [isInternetReachable ? '#1162E6' : '#F36F56', '#f7f7f7'],
      ),
    };
  });

  useEffect(() => {
    dispatch(getTransactions());
  }, []);

  // change headerLeft button based on if card is open
  // if transaction list is shown, show settings button
  // if < arrow shown, pressing closes the active card

  const navigationBarPress = useMemo(
    () => (
      <HeaderButton
        onPress={() => {
          setBottomSheetFolded(true);
          setActiveTab(0);
        }}
        imageSource={require('../assets/images/back-icon.png')}
      />
    ),

    [],
  );

  const settingsBarPress = useMemo(
    () => (
      <HeaderButton
        onPress={() => navigation.navigate('SettingsStack')}
        imageSource={require('../assets/icons/settings-cog.png')}
      />
    ),
    /* eslint-disable react-hooks/exhaustive-deps */
    [],
  );

  useEffect(() => {
    if (activeTab !== 0) {
      navigation.setOptions({
        headerLeft: () => navigationBarPress,
      });
    } else {
      navigation.setOptions({
        headerLeft: () => settingsBarPress,
      });
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [activeTab, navigation]);

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

  const walletButtonAnimDuration = 200;
  const rotateArrowAnim = useSharedValue(0);
  const rotateArrow = () => {
    rotateArrowAnim.value = withTiming(isWalletsModalOpened ? 0 : 1, {
      duration: walletButtonAnimDuration,
    });
  };
  const animatedWalletButtonArrowStyle = useAnimatedProps(() => {
    const spinIterpolation = interpolate(
      rotateArrowAnim.value,
      [0, 1],
      [270, 90],
    );
    return {
      transform: [{rotate: `${spinIterpolation}deg`}],
    };
  });

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
          animDuration={walletButtonAnimDuration}
          rotateArrow={rotateArrow}
          arrowSpinAnim={animatedWalletButtonArrowStyle}
        />
      </Animated.View>
    ),
    [animatedWalletButton, currentWallet, isWalletsModalOpened],
  );

  const fadingTimeout = useRef<NodeJS.Timeout>();
  const walletButtonFadingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isWalletsModalOpened || isTxDetailModalOpened) {
      buttonOpacity.value = withTiming(0, {duration: 150});

      fadingTimeout.current = setTimeout(() => {
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

      walletButtonFadingTimeout.current = setTimeout(() => {
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
      clearTimeout(fadingTimeout.current);
      clearTimeout(walletButtonFadingTimeout.current);
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
          <Canvas style={{height: 50, width: 60}}>
            <RoundedRect
              x={0}
              y={0}
              width={90}
              height={50}
              color="white"
              r={10}
            />
            <Image image={image} x={20} y={16} width={17} height={16} />
          </Canvas>
        </Pressable>
      </View>
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
        transactions={displayedTxs}
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
      />
    </View>
  );

  const HeaderComponent = (
    <View style={styles.headerContainer}>
      <DashboardButton
        title="Buy"
        imageSource={require('../assets/icons/buy-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(1);
        }}
        active={activeTab === 1}
        textPadding={8}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Sell"
        imageSource={require('../assets/icons/sell-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(2);
        }}
        active={activeTab === 2}
        textPadding={7}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Convert"
        wider={true}
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
          setBottomSheetFolded(false);
          setActiveTab(4);
        }}
        active={activeTab === 4}
        textPadding={11}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        title="Receive"
        imageSource={require('../assets/icons/receive-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
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
      <NewAmountView animatedProps={animatedHeaderHeight}>
        <Animated.View
          style={[animatedHeaderStyle, styles.amountViewContainer]}>
          <LineChart />
          <DatePicker />
        </Animated.View>
      </NewAmountView>

      <BottomSheet
        headerComponent={HeaderComponent}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
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
        isSwiperActive={transactions.length > 1 ? true : false}
        animDuration={250}
        gapInPixels={250}
        backSpecifiedStyle={{backgroundColor: 'rgba(17, 74, 175, 0.8)'}}
        gapSpecifiedStyle={{backgroundColor: 'transparent'}}
        swipeToPrevTx={swipeToPrevTx}
        swipeToNextTx={swipeToNextTx}
        renderBody={(
          _,
          __,
          ___,
          ____,
          cardTranslateAnim: any,
          cardOpacityAnim: any,
          prevNextCardOpacityAnim: any,
          paginationOpacityAnim: any,
        ) => (
          <TxDetailModalContent
            close={() => {
              setTxDetailModalOpened(false);
            }}
            transaction={selectedTransaction}
            txsNum={transactions.length}
            setTransactionIndex={(txIndex: number) => {
              setTransactionIndex(txIndex);
            }}
            cardTranslateAnim={cardTranslateAnim}
            cardOpacityAnim={cardOpacityAnim}
            prevNextCardOpacityAnim={prevNextCardOpacityAnim}
            paginationOpacityAnim={paginationOpacityAnim}
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
        rotateWalletButtonArrow={rotateArrow}
        renderBody={(
          isOpened: boolean,
          showAnim: boolean,
          animDelay: number,
          animDuration: number,
          cardTranslateAnim: any,
        ) => (
          <WalletsModalContent
            isOpened={isOpened}
            showAnim={showAnim}
            animDelay={animDelay}
            animDuration={animDuration}
            cardTranslateAnim={cardTranslateAnim}
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
    justifyContent: 'center',
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
  amountViewContainer: {
    paddingTop: 30,
    gap: 50,
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
        rotateArrow={() => {}}
        arrowSpinAnim={undefined}
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
