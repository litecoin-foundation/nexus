import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {View, StyleSheet, Pressable, DeviceEventEmitter} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {RouteProp} from '@react-navigation/native';
import {
  Canvas,
  Image,
  RoundedRect,
  useImage,
  Shadow,
} from '@shopify/react-native-skia';
import {
  CUSTODY_MODEL,
  dismissAllModals,
  payment,
  TransactionRequest,
} from '@flexa/flexa-react-native';
import {StackNavigationOptions} from '@react-navigation/stack';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import HeaderButton from '../components/Buttons/HeaderButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import Buy from '../components/Cards/Buy';
import Sell from '../components/Cards/Sell';
import PlasmaModal from './../components/Modals/PlasmaModal';
import WalletsModalContent from './../components/Modals/WalletsModalContent';
import TxDetailModalContent from './../components/Modals/TxDetailModalContent';
import BottomSheet from '../components/BottomSheet';
import TransactionList from '../components/TransactionList';
import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';
import DatePicker from '../components/DatePicker';
import TranslateText from '../components/TranslateText';
import PinModalContent from '../components/Modals/PinModalContent';
import LoadingIndicator from '../components/LoadingIndicator';
import Convert from '../components/Cards/Convert';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {sendOnchainPayment, txDetailSelector} from '../reducers/transaction';
import {unsetDeeplink, decodeAppDeeplink} from '../reducers/deeplinks';
import {sleep} from '../lib/utils/poll';
import {validate as validateLtcAddress} from '../lib/utils/validate';
import {showError} from '../reducers/errors';

import {ScreenSizeContext} from '../context/screenSize';

interface URIHandlerRef {
  handleURI: (data: string) => void;
}

type RootStackParamList = {
  Main: {
    scanData?: string;
    isInitial?: boolean;
    updateHeader?: boolean;
  };
  SearchTransaction: undefined;
};

interface Props {
  navigation: any;
  route: RouteProp<RootStackParamList, 'Main'>;
}

interface TxListComponentProps {
  selectTransaction: (option: any) => void;
  setTxDetailModalOpened: (option: boolean) => void;
  foldUnfoldBottomSheet: (option: boolean) => void;
  isBottomSheetFolded: boolean;
  navigation: any;
  styles: {
    [key: string]: any;
  };
}

const TxListComponent: React.FC<TxListComponentProps> = props => {
  const {
    selectTransaction,
    setTxDetailModalOpened,
    foldUnfoldBottomSheet,
    isBottomSheetFolded,
    navigation,
    styles,
  } = props;
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const image = useImage(require('../assets/icons/search-icon.png'));

  return (
    <View>
      <View style={styles.txTitleContainer}>
        <TranslateText
          textKey={'latest_txs'}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.025}
          maxLengthInPixels={SCREEN_WIDTH * 0.8}
          textStyle={styles.txTitleText}
          numberOfLines={1}
        />

        <Pressable onPress={() => navigation.navigate('SearchTransaction')}>
          <Canvas style={styles.txSearchBtnCanvas}>
            <RoundedRect
              x={SCREEN_HEIGHT * 0.02}
              y={SCREEN_HEIGHT * 0.01}
              width={SCREEN_HEIGHT * 0.1}
              height={SCREEN_HEIGHT * 0.05}
              color="white"
              r={SCREEN_HEIGHT * 0.01}>
              <Shadow dx={0} dy={2} blur={4} color={'rgba(0, 0, 0, 0.07)'} />
            </RoundedRect>
            <Image
              image={image}
              x={SCREEN_HEIGHT * 0.035}
              y={SCREEN_HEIGHT * 0.025}
              width={SCREEN_HEIGHT * 0.02}
              height={SCREEN_HEIGHT * 0.02}
              fit="scaleDown"
            />
          </Canvas>
        </Pressable>
      </View>
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
        headerBackgroundColor="#F7F7F7"
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
      />
    </View>
  );
};

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const headerButtonsHeight = SCREEN_HEIGHT * 0.035;
  const deviceHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const stackHeaderHeight = deviceHeaderHeight - insets.top;
  const alignHeaderElementsWithMarginTop = useMemo(() => {
    return {marginTop: (stackHeaderHeight - headerButtonsHeight) * -1};
  }, [stackHeaderHeight, headerButtonsHeight]);

  // fixes a bug where navigating back from ConfirmBuy/Sell WebPage
  // causes header to disappear or not follow inset rules!
  useEffect(() => {
    if (route.params?.updateHeader) {
      navigation.setOptions({
        headerShown: false,
      });

      setTimeout(() => {
        navigation.setOptions({
          headerShown: true,
        });
      }, 10);
    }
  }, [route, navigation]);

  const SNAP_POINTS_FROM_TOP = [SCREEN_HEIGHT * 0.24, SCREEN_HEIGHT * 0.47];
  const OPEN_SNAP_POINT = SNAP_POINTS_FROM_TOP[0];
  const CLOSED_SNAP_POINT =
    SNAP_POINTS_FROM_TOP[SNAP_POINTS_FROM_TOP.length - 1];

  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks);

  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
  // const [currentWallet, setCurrentWallet] = useState('main_wallet');
  const currentWallet = 'main_wallet';
  const uniqueId = useAppSelector(state => state.onboarding.uniqueId);
  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const confirmedBalance = useAppSelector(
    state => state.balance.confirmedBalance,
  );
  const isFlexaCustomer = useAppSelector(state => state.buy.isFlexaCustomer);
  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  const [loading, setLoading] = useState(false);

  // flexa
  const flexaAssetAccounts = [
    {
      displayName: 'Main Wallet',
      assetAccountHash: uniqueId,
      availableAssets: [
        {
          assetId: 'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2',
          symbol: 'LTC',
          displayName: 'Litecoin',
          balance: Number(totalBalance) / 100000000, // sats -> Litecoin
          balanceAvailable: Number(confirmedBalance) / 100000000,
          icon: require('../assets/images/ltc-logo.png'),
        },
      ],
      custodyModel: CUSTODY_MODEL.LOCAL,
    },
  ];

  const manualPayment = async () => {
    payment(flexaAssetAccounts, paymentCallback);
  };

  const paymentCallback = async (transactionRequest: TransactionRequest) => {
    const {transaction, transactionSent, transactionFailed} =
      transactionRequest;

    dismissAllModals();
    await sleep(200);

    console.log(transaction);
    const addrArray = transaction.destinationAddress.split(':');

    // validation of destinationAddress
    try {
      if (addrArray.length !== 3) {
        throw new Error('unknown address length');
      }
      if (addrArray[1] !== '12a765e31ffd4059bada1e25190f6e98') {
        throw new Error('not a litecoin address');
      }
      const valid = await validateLtcAddress(addrArray[2]);
      if (!valid) {
        throw new Error('invalid litecoin address');
      }
    } catch (error) {
      transactionFailed();
      payment(flexaAssetAccounts, paymentCallback);
      dispatch(showError(String(error)));
    }

    try {
      // authenticate
      await handleAuthenticationRequired('view-seed-auth');
      setLoading(true);
      // send coins
      const txid = await dispatch(
        sendOnchainPayment(
          addrArray[2],
          Math.trunc(Number(transaction.amount) * 100000000),
          'Flexa Payment',
        ),
      );
      console.log(txid);
      transactionSent(txid);
      setIsPinModalOpened(false);
      setLoading(false);
      // reopen flexa modal
      payment(flexaAssetAccounts, paymentCallback);
    } catch (error) {
      transactionFailed();
      setIsPinModalOpened(false);
      setLoading(false);
      payment(flexaAssetAccounts, paymentCallback);
      dispatch(showError(String(error)));
    }
  };

  function openPinModal(action: string) {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }

  const handleAuthenticationRequired = (action: string) => {
    return new Promise<void>((resolve, reject) => {
      openPinModal(action);
      const subscription = DeviceEventEmitter.addListener(action, bool => {
        if (bool === true) {
          setIsPinModalOpened(false);
          subscription.remove();
          resolve();
        } else if (bool === false) {
          subscription.remove();
          reject();
        }
      });
    });
  };

  // Transaction Detail Modal Swiping
  // const image = useImage(require('../assets/icons/search-icon.png'));
  const sendCardRef = useRef<URIHandlerRef>(null);

  function setTransactionIndex(newTxIndex: number) {
    selectTransaction(transactions[newTxIndex]);
  }

  function swipeToPrevTx() {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('renderIndex')) {
        const newTxIndex =
          selectedTransaction.renderIndex > 0
            ? selectedTransaction.renderIndex - 1
            : transactions.length - 1;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }

  function swipeToNextTx() {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('renderIndex')) {
        const newTxIndex =
          selectedTransaction.renderIndex < transactions.length - 1
            ? selectedTransaction.renderIndex + 1
            : 0;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }

  // Deeplink handler
  useEffect(() => {
    if (deeplinkSet) {
      if (uri.startsWith('litecoin:')) {
        setBottomSheetFolded(false);
        setActiveTab(4);
      } else if (uri.startsWith('nexus://')) {
        const decodedDeeplink = decodeAppDeeplink(uri);
        if (
          decodedDeeplink &&
          decodedDeeplink.stack.length > 0 &&
          decodedDeeplink.screen.length > 0
        ) {
          navigation.navigate(decodedDeeplink.stack, {
            screen: decodedDeeplink.screen,
            params: {scanData: decodedDeeplink.options?.key},
          });
        }
      }
    }
  }, [deeplinkSet, uri, navigation]);

  useEffect(() => {
    const callHandleURI = async () => {
      // TODO: hacky way to ensure Send Card is mounted
      //       before calling handleURI().
      //       Handle this differently in the future?
      await sleep(500);
      sendCardRef.current?.handleURI(uri);
    };

    if (activeTab === 4) {
      callHandleURI();
      dispatch(unsetDeeplink());
    }
  }, [activeTab, uri, dispatch]);

  // Animation
  const mainSheetsTranslationY = useSharedValue(CLOSED_SNAP_POINT);
  const mainSheetsTranslationYStart = useSharedValue(CLOSED_SNAP_POINT);
  const [isBottomSheetFolded, setBottomSheetFolded] = useState(true);
  function foldUnfoldBottomSheet(isFolded: boolean) {
    if (isFolded) {
      setBottomSheetFolded(false);
    } else {
      setBottomSheetFolded(true);
      setActiveTab(0);
    }
  }

  useEffect(() => {
    if (route.params?.isInitial) {
      foldUnfoldBottomSheet(false);
    }
  }, [route]);

  const animatedChartStyle = useAnimatedStyle(() => {
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
        [0, SCREEN_HEIGHT * 0.05],
      ),
      borderBottomRightRadius: interpolate(
        mainSheetsTranslationY.value,
        [OPEN_SNAP_POINT, CLOSED_SNAP_POINT],
        [1, SCREEN_HEIGHT * 0.05],
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

  const walletButtonRef = useRef() as any;
  const walletButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View
          ref={walletButtonRef}
          style={[styles.walletButton, animatedWalletButton]}>
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
      </View>
    ),
    /* eslint-disable react-hooks/exhaustive-deps */
    [
      animatedWalletButton,
      currentWallet,
      isWalletsModalOpened,
      animatedWalletButtonArrowStyle,
      alignHeaderElementsWithMarginTop,
    ],
  );

  useLayoutEffect(() => {
    walletButtonRef.current?.measure(
      (_: any, __: any, ___: any, height: any, ____: any, pageY: any) => {
        setPlasmaModalGapInPixels(height + pageY);
      },
    );
  });

  const fadingTimeout = useRef<NodeJS.Timeout>();
  const walletButtonFadingTimeout = useRef<NodeJS.Timeout>();

  const backHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <HeaderButton
          onPress={() => {
            setBottomSheetFolded(true);
            setActiveTab(0);
          }}
          imageSource={require('../assets/images/back-icon.png')}
        />
      </View>
    ),
    [alignHeaderElementsWithMarginTop],
  );

  const leftHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedButton]}>
          <HeaderButton
            onPress={() => navigation.navigate('SettingsStack')}
            imageSource={require('../assets/icons/settings-cog.png')}
            imageXY={{x: SCREEN_HEIGHT * 0.02, y: SCREEN_HEIGHT * 0.02}}
          />
          {isFlexaCustomer ? (
            <HeaderButton
              onPress={() => manualPayment()}
              imageSource={require('../assets/icons/shop.png')}
              marginLeft={SCREEN_WIDTH * 0.02 * -1}
            />
          ) : null}
        </Animated.View>
      </View>
    ),
    /* eslint-disable react-hooks/exhaustive-deps */
    [
      animatedButton,
      navigation,
      isFlexaCustomer,
      SCREEN_HEIGHT,
      SCREEN_WIDTH,
      alignHeaderElementsWithMarginTop,
      styles.headerBtns,
    ],
  );

  const rightHeaderButton = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={[styles.headerBtns, animatedButton]}>
          <HeaderButton
            onPress={() => navigation.navigate('AlertsStack')}
            imageSource={require('../assets/icons/alerts-icon.png')}
            rightPadding={true}
            imageXY={{x: SCREEN_HEIGHT * 0.028, y: SCREEN_HEIGHT * 0.028}}
          />
        </Animated.View>
      </View>
    ),
    [animatedButton, navigation, alignHeaderElementsWithMarginTop],
  );

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
        headerLeft: () =>
          activeTab !== 0 ? backHeaderButton : leftHeaderButton,
        headerRight: () => rightHeaderButton,
      });
    }

    if (isTxDetailModalOpened) {
      walletButtonOpacity.value = withTiming(0, {duration: 150});

      walletButtonFadingTimeout.current = setTimeout(() => {
        navigation.setOptions({
          /* eslint-disable-next-line react/no-unstable-nested-components */
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
    activeTab,
    backHeaderButton,
    leftHeaderButton,
    rightHeaderButton,
    walletButton,
    navigation,
    isWalletsModalOpened,
    isTxDetailModalOpened,
    buttonOpacity,
    walletButtonOpacity,
  ]);

  const HeaderComponent = (
    <View style={styles.headerContainer}>
      <DashboardButton
        textKey="buy"
        imageSource={require('../assets/icons/buy-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(1);
        }}
        active={activeTab === 1}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        textKey="sell"
        imageSource={require('../assets/icons/sell-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(2);
        }}
        active={activeTab === 2}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        textKey="convert"
        wider={true}
        imageSource={require('../assets/icons/convert-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(3);
        }}
        active={activeTab === 3}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        textKey="send"
        imageSource={require('../assets/icons/send-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(4);
        }}
        active={activeTab === 4}
        disabled={!isInternetReachable ? true : false}
        sizePercentage={90}
      />
      <DashboardButton
        textKey="receive"
        imageSource={require('../assets/icons/receive-icon.png')}
        handlePress={() => {
          setBottomSheetFolded(false);
          setActiveTab(5);
        }}
        active={activeTab === 5}
        disabled={false}
        sizePercentage={90}
      />
    </View>
  );

  const TxListComponentMemo = useMemo(
    () => (
      <TxListComponent
        selectTransaction={selectTransaction}
        setTxDetailModalOpened={setTxDetailModalOpened}
        foldUnfoldBottomSheet={foldUnfoldBottomSheet}
        isBottomSheetFolded={isBottomSheetFolded}
        navigation={navigation}
        styles={styles}
      />
    ),
    [isBottomSheetFolded],
  );

  const BottomSheetMemo = useMemo(
    () => (
      <BottomSheet
        headerComponent={HeaderComponent}
        txViewComponent={TxListComponentMemo}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
        activeTab={activeTab}
        buyViewComponent={<Buy />}
        sellViewComponent={<Sell />}
        convertViewComponent={<Convert />}
        sendViewComponent={
          <Send route={route} navigation={navigation} ref={sendCardRef} />
        }
        receiveViewComponent={<Receive />}
      />
    ),
    [
      HeaderComponent,
      TxListComponentMemo,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      isBottomSheetFolded,
      activeTab,
      route,
    ],
  );

  const plasmaModal_TxDetailModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(17, 74, 175, 0.8)',
  };
  const plasmaModal_TxDetailModalContent_gapSpecifiedStyle = {
    backgroundColor: 'transparent',
  };
  const plasmaModal_WalletsModalContent_backSpecifiedStyle = {
    backgroundColor: 'transparent',
  };
  const plasmaModal_PinModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(19,58,138, 0.6)',
  };

  return (
    <Animated.View
      style={[styles.container, animatedHeaderContainerBackground]}>
      <NewAmountView
        animatedProps={animatedHeaderHeight}
        internetOpacityStyle={animatedChartStyle}>
        <Animated.View style={[animatedChartStyle, styles.chartContainer]}>
          <LineChart />
          <DatePicker />
        </Animated.View>
      </NewAmountView>

      {BottomSheetMemo}

      <PlasmaModal
        isOpened={isTxDetailModalOpened}
        close={() => {
          setTxDetailModalOpened(false);
        }}
        isFromBottomToTop={true}
        isSwiperActive={transactions.length > 1 ? true : false}
        animDuration={250}
        gapInPixels={SCREEN_HEIGHT * 0.22}
        backSpecifiedStyle={plasmaModal_TxDetailModalContent_backSpecifiedStyle}
        gapSpecifiedStyle={plasmaModal_TxDetailModalContent_gapSpecifiedStyle}
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
        backSpecifiedStyle={plasmaModal_WalletsModalContent_backSpecifiedStyle}
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

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => setIsPinModalOpened(false)}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={plasmaModal_PinModalContent_backSpecifiedStyle}
        renderBody={(_, __, ___, ____, cardTranslateAnim: any) => (
          <PinModalContent
            cardTranslateAnim={cardTranslateAnim}
            close={() => setIsPinModalOpened(false)}
            handleValidationFailure={() => {
              setLoading(false);
              DeviceEventEmitter.emit(pinModalAction.current, false);
            }}
            handleValidationSuccess={() => {
              setLoading(false);
              DeviceEventEmitter.emit(pinModalAction.current, true);
            }}
          />
        )}
      />

      <LoadingIndicator visible={loading} />
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    chartContainer: {
      paddingTop:
        screenHeight < 701 ? screenHeight * 0.03 : screenHeight * 0.04,
      gap: screenHeight < 701 ? screenHeight * 0.035 : screenHeight * 0.05,
    },
    headerContainer: {
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    headerBtns: {
      width: 'auto',
      height: 'auto',
      flexDirection: 'row',
    },
    walletButton: {
      width: 'auto',
      height: 'auto',
    },
    txTitleContainer: {
      width: '100%',
      height: screenHeight * 0.07,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    txTitleText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontWeight: '500',
      letterSpacing: -0.59,
      paddingLeft: screenWidth * 0.04,
    },
    txSearchBtnCanvas: {
      width: screenHeight * 0.07,
      height: screenHeight * 0.07,
    },
  });

export const navigationOptions = (navigation: any): StackNavigationOptions => {
  return {
    headerShown: true,
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
    headerTitleAlign: 'center',
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
        imageSource={require('../assets/icons/alerts-icon.png')}
        rightPadding={true}
      />
    ),
  };
};

export default Main;
