import React, {
  memo,
  useEffect,
  useState,
  useRef,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import {View, StyleSheet, Pressable, DeviceEventEmitter} from 'react-native';
import {getCountry} from 'react-native-localize';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {RouteProp} from '@react-navigation/native';
import {useDrawerStatus} from '@react-navigation/drawer';
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

import GlassAmountView from '../components/GlassAmountView';
import GlassTopSectionChart from '../components/GlassTopSectionChart';
import HeaderButton from '../components/Buttons/HeaderButton';
import GlassTabSelector from '../components/GlassTabSelector';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import Buy from '../components/Cards/Buy';
import Sell from '../components/Cards/Sell';
import PlasmaModal from './../components/Modals/PlasmaModal';
import TxDetailModalContent from './../components/Modals/TxDetailModalContent';
import GlassBottomSheet from '../components/GlassBottomSheet';
import GlassSheetBackdrop, {
  DRAG_STRIP_HEIGHT_RATIO,
  GlassTxRowModels,
  SHEET_BACKGROUND,
  TX_TITLE_ROW_HEIGHT_RATIO,
  useGlassTxRowModels,
} from '../components/GlassSheetBackdrop';
import GlassTransactionList from '../components/GlassTransactionList';
import LiquidGlassWalletButton from '../components/Buttons/LiquidGlassWalletButton';
import LiquidGlassWalletModal from './../components/Modals/LiquidGlassWalletModal';
import LiquidGlassAlertModal from '../components/Modals/LiquidGlassAlertModal';
import LiquidGlassTabBar, {
  getTabBarClearance,
} from '../components/LiquidGlassTabBar';
import TranslateText from '../components/TranslateText';
import PinModalContent from '../components/Modals/PinModalContent';
import PopUpModal from '../components/Modals/PopUpModal';
import ScheduledPopUpModal from '../components/Modals/ScheduledPopUpModal';
import LoadingIndicator from '../components/LoadingIndicator';
import GiftCardShop from '../components/Cards/GiftCardShop';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {sendOnchainPayment, txDetailSelector} from '../reducers/transaction';
import {flattenGroupedTransactions} from '../utils/groupTransactions';
import {unsetDeeplink, decodeAppDeeplink} from '../reducers/deeplinks';
import {setOpenedNotification} from '../reducers/settings';
import {sleep} from '../utils/poll';
import {validate as validateLtcAddress} from '../utils/validate';
import {showError} from '../reducers/errors';

import {ScreenSizeContext} from '../context/screenSize';
import {
  useNewMainAnims,
  getNewMainSheetPoints,
} from '../animations/useNewMainAnims';
import {useMainLayout} from '../animations/useMainLayout';

interface URIHandlerRef {
  handleURI: (data: string) => void;
}

type RootStackParamList = {
  Main: {
    scanData?: string;
    isInitial?: boolean;
    activeCard?: number;
    shopScreen?: string;
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
  styles: Record<string, any>;
  txRows: any[];
  txRowModels: GlassTxRowModels;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  onScrollActivity: () => void;
  txListScrollY: SharedValue<number>;
  txListHeaderOffset: SharedValue<number>;
}

const TxListComponent: React.FC<TxListComponentProps> = memo(props => {
  const {
    selectTransaction,
    setTxDetailModalOpened,
    foldUnfoldBottomSheet,
    isBottomSheetFolded,
    navigation,
    styles,
    txRows,
    txRowModels,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    onScrollActivity,
    txListScrollY,
    txListHeaderOffset,
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
          <Canvas style={styles.txSearchBtnCanvas} pointerEvents="none">
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
      <GlassTransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
        rows={txRows}
        rowModels={txRowModels}
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        onScrollActivity={onScrollActivity}
        scrollY={txListScrollY}
        listHeaderOffset={txListHeaderOffset}
      />
    </View>
  );
});

const NewMain: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_HEIGHT, SCREEN_WIDTH],
  );
  const insets = useSafeAreaInsets();

  // Keep card CTAs above the floating tab bar.
  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const cardHeight =
    SCREEN_HEIGHT -
    UNFOLD_SHEET_POINT -
    SCREEN_HEIGHT * DRAG_STRIP_HEIGHT_RATIO -
    getTabBarClearance(SCREEN_HEIGHT, insets.bottom);
  const SHOP_CARD_EXTRA_HEIGHT = 115;
  const shopCardHeight = cardHeight + SHOP_CARD_EXTRA_HEIGHT;
  const tabBarBandTop =
    SCREEN_HEIGHT - getTabBarClearance(SCREEN_HEIGHT, insets.bottom);

  const isInternetReachable = useAppSelector(
    state => state.info!.isInternetReachable,
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  // Shared by the spacer list and Skia row renderers.
  const txRows = useMemo(
    () => flattenGroupedTransactions(transactions),
    [transactions],
  );
  const txRowModels = useGlassTxRowModels(txRows);
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks!);
  const {openedNotification} = useAppSelector(state => state.settings!);

  const dispatch = useAppDispatch();

  const drawerStatus = useDrawerStatus();
  const isShopAccountDrawerOpen = drawerStatus === 'open';

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
  const [isPopUpModalOpened, setIsPopUpModalOpened] = useState(false);
  const currentWallet = 'main_wallet';
  const uniqueId = useAppSelector(state => state.onboarding!.uniqueId);
  const totalBalance = useAppSelector(state => state.balance!.totalBalance);
  const confirmedBalance = useAppSelector(
    state => state.balance!.confirmedBalance,
  );
  const isFlexaCustomer = useAppSelector(state => state.buy!.isFlexaCustomer);
  const [isPinModalOpened, setIsPinModalOpened] = useState(false);
  const pinModalAction = useRef<string>('view-seed-auth');
  const [loading, setLoading] = useState(false);
  const [triggerLester, setTriggerLester] = useState(0);

  const recoveryMode = useAppSelector(state => state.info!.recoveryMode);
  const recoveryFinished = useAppSelector(
    state => state.info!.recoveryFinished,
  );
  const recoveryRestarted = useAppSelector(
    state => state.info!.recoveryRestarted,
  );
  const [recoveryAlertDismissed, setRecoveryAlertDismissed] = useState(false);
  const showRecoveryAlert =
    recoveryMode && !recoveryFinished && !recoveryAlertDismissed;

  const mainContentRef = useRef<View>(null);
  const bottomSheetCaptureRef = useRef<View>(null);

  // 0 = idle, 1 = content interaction shrinks the tab bar.
  const tabBarActivity = useSharedValue(0);
  const txListScrollY = useSharedValue(0);
  const txListHeaderOffset = useSharedValue(0);
  const tabBarIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentTouchStart = useRef({x: 0, y: 0});

  const markTabBarActivity = useCallback(() => {
    if (tabBarIdleTimer.current === null) {
      tabBarActivity.value = withSpring(1, {mass: 0.4});
    } else {
      clearTimeout(tabBarIdleTimer.current);
    }
    tabBarIdleTimer.current = setTimeout(() => {
      tabBarIdleTimer.current = null;
      tabBarActivity.value = withSpring(0, {mass: 0.4});
    }, 700);
  }, [tabBarActivity]);

  useEffect(
    () => () => {
      if (tabBarIdleTimer.current) {
        clearTimeout(tabBarIdleTimer.current);
      }
    },
    [],
  );

  const [isBottomSheetFolded, setBottomSheetFolded] = useState(true);
  const foldUnfoldBottomSheet = useCallback((isFolded: boolean) => {
    if (isFolded) {
      setBottomSheetFolded(false);
    } else {
      setBottomSheetFolded(true);
      setActiveTab(0);
    }
  }, []);
  useEffect(() => {
    if (route.params?.isInitial) {
      foldUnfoldBottomSheet(false);
    } else if (route.params?.activeCard) {
      setActiveTab(route.params?.activeCard);
      setBottomSheetFolded(false);
    }
  }, [route, foldUnfoldBottomSheet]);

  const closePopUpModalHandler = useCallback(() => {
    setIsPopUpModalOpened(false);
    dispatch(setOpenedNotification(null));
  }, [dispatch]);
  useEffect(() => {
    if (!openedNotification) {
      return;
    }
    if (openedNotification?.data?.openUrl) {
      navigation.navigate('WebPage', {uri: openedNotification.data.openUrl});
      dispatch(setOpenedNotification(null));
    } else if (openedNotification?.data?.showInAppPopUp === 'true') {
      setIsPopUpModalOpened(true);
    }
  }, [openedNotification, navigation, dispatch]);

  const [plasmaModalGapInPixels, setPlasmaModalGapInPixels] = useState(0);

  const toggleShopAccountDrawer = useCallback(() => {
    if (activeTab === 3) {
      if (isShopAccountDrawerOpen) {
        navigation.closeDrawer?.();
      } else {
        navigation.openDrawer?.();
      }
    }
  }, [activeTab, isShopAccountDrawerOpen, navigation]);

  useEffect(() => {
    if (activeTab !== 3 && isShopAccountDrawerOpen) {
      navigation.closeDrawer?.();
    }
  }, [activeTab, isShopAccountDrawerOpen, navigation]);

  const {
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    walletButtonAnimDuration,
    rotateArrow,
    animatedChartOpacity,
    animatedTopContainerHeight,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
  } = useNewMainAnims({isWalletsModalOpened, isTxDetailModalOpened, activeTab});

  const flexaAssetAccounts = useMemo(
    () => [
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
    ],
    [uniqueId, totalBalance, confirmedBalance],
  );

  const openPinModal = useCallback((action: string) => {
    pinModalAction.current = action;
    setIsPinModalOpened(true);
  }, []);

  const handleAuthenticationRequired = useCallback(
    (action: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        openPinModal(action);
        const subscription = DeviceEventEmitter.addListener(
          action,
          (bool: boolean) => {
            if (bool === true) {
              setIsPinModalOpened(false);
              subscription.remove();
              resolve();
            } else if (bool === false) {
              subscription.remove();
              reject(new Error('Authentication failed'));
            }
          },
        );
      });
    },
    [openPinModal],
  );

  const paymentCallback = useCallback(
    async (transactionRequest: TransactionRequest) => {
      const {transaction, transactionSent, transactionFailed} =
        transactionRequest;

      dismissAllModals();
      await sleep(200);

      const addrArray = transaction.destinationAddress.split(':');

      try {
        if (!addrArray || addrArray.length !== 3) {
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
        await handleAuthenticationRequired('view-seed-auth');
        setLoading(true);
        const txid = await dispatch(
          sendOnchainPayment(
            addrArray[2],
            Math.trunc(Number(transaction.amount) * 100000000),
            'Flexa Payment',
          ),
        );
        transactionSent(txid);
        setIsPinModalOpened(false);
        setLoading(false);
        payment(flexaAssetAccounts, paymentCallback);
      } catch (error) {
        transactionFailed();
        setIsPinModalOpened(false);
        setLoading(false);
        payment(flexaAssetAccounts, paymentCallback);
        dispatch(showError(String(error)));
      }
    },
    [dispatch, flexaAssetAccounts, handleAuthenticationRequired],
  );

  const manualPayment = useCallback(async () => {
    payment(flexaAssetAccounts, paymentCallback);
  }, [flexaAssetAccounts, paymentCallback]);

  const sendCardRef = useRef<URIHandlerRef>(null);

  const setTransactionIndex = useCallback(
    (newTxIndex: number) => {
      selectTransaction(transactions[newTxIndex]);
    },
    [transactions],
  );

  const swipeToPrevTx = useCallback(() => {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('renderIndex')) {
        const newTxIndex =
          selectedTransaction.renderIndex > 0
            ? selectedTransaction.renderIndex - 1
            : transactions.length - 1;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }, [selectedTransaction, transactions]);

  const swipeToNextTx = useCallback(() => {
    if (selectedTransaction) {
      if (selectedTransaction.hasOwnProperty('renderIndex')) {
        const newTxIndex =
          selectedTransaction.renderIndex < transactions.length - 1
            ? selectedTransaction.renderIndex + 1
            : 0;
        selectTransaction(transactions[newTxIndex]);
      }
    }
  }, [selectedTransaction, transactions]);

  useEffect(() => {
    if (deeplinkSet) {
      if (uri.startsWith('litecoin:')) {
        setBottomSheetFolded(false);
        setActiveTab(4);
      } else if (uri.startsWith('nexus://verifyotp')) {
        const decodedDeeplink = decodeAppDeeplink(uri);
        if (
          decodedDeeplink &&
          decodedDeeplink.stack?.length > 0 &&
          decodedDeeplink.screen?.length > 0
        ) {
          navigation.navigate(decodedDeeplink.stack, {
            screen: decodedDeeplink.screen,
            params: {otpCode: decodedDeeplink.options?.otp},
          });
        }
      } else if (uri.startsWith('nexus://')) {
        const decodedDeeplink = decodeAppDeeplink(uri);
        if (
          decodedDeeplink &&
          decodedDeeplink.stack?.length > 0 &&
          decodedDeeplink.screen?.length > 0
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
      // Wait for Send to mount before forwarding the URI.
      await sleep(500);
      sendCardRef.current?.handleURI(uri);
    };

    if (activeTab === 4 && deeplinkSet && uri.startsWith('litecoin:')) {
      callHandleURI();
      dispatch(unsetDeeplink());
    }
  }, [activeTab, uri, deeplinkSet, dispatch]);

  useMainLayout({
    walletButtonAnimDuration,
    rotateArrow,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
    currentWallet,
    activeTab,
    navigation,
    isWalletsModalOpened,
    setWalletsModalOpened,
    isShopAccountDrawerOpen,
    toggleShopAccountDrawer,
    isTxDetailModalOpened,
    setPlasmaModalGapInPixels,
    setBottomSheetFolded,
    setActiveTab,
    manualPayment,
    isFlexaCustomer,
    styles,
  });

  const handleTabPress = useCallback(
    (tab: number) => {
      if (tab === 1 && getCountry() === 'GB') {
        navigation.navigate('ConfirmBuy', {prefilledMethod: ''});
        return;
      }
      if (tab === 2 && getCountry() === 'GB') {
        navigation.navigate('ConfirmSell', {prefilledMethod: ''});
        return;
      }
      setBottomSheetFolded(false);
      setActiveTab(tab);
    },
    [navigation],
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
        txRows={txRows}
        txRowModels={txRowModels}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        onScrollActivity={markTabBarActivity}
        txListScrollY={txListScrollY}
        txListHeaderOffset={txListHeaderOffset}
      />
    ),
    [
      foldUnfoldBottomSheet,
      isBottomSheetFolded,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      markTabBarActivity,
      navigation,
      styles,
      txListHeaderOffset,
      txListScrollY,
      txRows,
      txRowModels,
    ],
  );

  const BottomSheetMemo = useMemo(
    () => (
      <GlassBottomSheet
        captureRef={bottomSheetCaptureRef}
        backdropComponent={
          <GlassSheetBackdrop
            rowModels={txRowModels}
            scrollY={txListScrollY}
            listHeaderOffset={txListHeaderOffset}
            showTxList={activeTab === 0}
          />
        }
        headerComponent={<View style={styles.dragStrip} />}
        txViewComponent={TxListComponentMemo}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={foldUnfoldBottomSheet}
        activeTab={activeTab}
        buyViewComponent={
          <Buy navigation={navigation} containerHeight={cardHeight} />
        }
        sellViewComponent={
          <Sell navigation={navigation} containerHeight={cardHeight} />
        }
        shopViewComponent={
          <GiftCardShop
            navigation={navigation}
            initialScreen={route.params?.shopScreen}
            containerHeight={shopCardHeight}
          />
        }
        sendViewComponent={
          <Send
            route={route}
            navigation={navigation}
            ref={sendCardRef}
            containerHeight={cardHeight}
          />
        }
        receiveViewComponent={<Receive containerHeight={cardHeight} />}
      />
    ),
    [
      TxListComponentMemo,
      txRowModels,
      txListScrollY,
      txListHeaderOffset,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      isBottomSheetFolded,
      foldUnfoldBottomSheet,
      activeTab,
      route,
      navigation,
      styles.dragStrip,
      cardHeight,
      shopCardHeight,
      bottomSheetCaptureRef,
    ],
  );

  const plasmaModal_TxDetailModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(17, 74, 175, 0.8)',
  };
  const plasmaModal_TxDetailModalContent_gapSpecifiedStyle = {
    backgroundColor: 'transparent',
  };
  const plasmaModal_PinModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(19,58,138, 0.6)',
  };

  return (
    <Animated.View
      ref={mainContentRef}
      collapsable={false}
      style={styles.container}
      // Track drags outside the tab bar band.
      onTouchStart={e => {
        contentTouchStart.current = {
          x: e.nativeEvent.pageX,
          y: e.nativeEvent.pageY,
        };
      }}
      onTouchMove={e => {
        const {pageX, pageY} = e.nativeEvent;
        if (pageY > tabBarBandTop) {
          return;
        }
        const dx = pageX - contentTouchStart.current.x;
        const dy = pageY - contentTouchStart.current.y;
        if (dx * dx + dy * dy > 64) {
          markTabBarActivity();
        }
      }}>
      <GlassAmountView
        animatedProps={animatedTopContainerHeight}
        internetOpacityStyle={animatedChartOpacity}
        onTriggerLester={() => setTriggerLester(prev => prev + 1)}
        mainSheetsTranslationY={mainSheetsTranslationY}
        activeTab={activeTab}>
        <GlassTopSectionChart
          animatedOpacityStyle={animatedChartOpacity}
          isBottomSheetFolded={isBottomSheetFolded}
          triggerLester={triggerLester}
        />
      </GlassAmountView>

      <GlassTabSelector
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={foldUnfoldBottomSheet}
        activeTab={activeTab}
        onPressTab={handleTabPress}
        isInternetReachable={!!isInternetReachable}
      />

      {BottomSheetMemo}

      <LiquidGlassTabBar
        activeIndex={activeTab === 3 ? 1 : 0}
        onSelectSection={(index: number) => {
          if (index === 0 && activeTab !== 0) {
            foldUnfoldBottomSheet(false);
          } else if (index === 1 && activeTab !== 3) {
            handleTabPress(3);
          }
        }}
        contentActivity={tabBarActivity}
        rowModels={txRowModels}
        mainSheetsTranslationY={mainSheetsTranslationY}
        txListScrollY={txListScrollY}
        listHeaderOffset={txListHeaderOffset}
        showTxList={activeTab === 0}
        activeSheet={activeTab}
        sheetCaptureRef={bottomSheetCaptureRef}
        shopDisabled={!isInternetReachable}
      />

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

      <LiquidGlassWalletModal
        isOpened={isWalletsModalOpened}
        close={() => {
          setWalletsModalOpened(false);
        }}
        gapInPixels={plasmaModalGapInPixels}
        rotateWalletButtonArrow={rotateArrow}
        contentViewRef={mainContentRef}
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

      <PopUpModal
        isVisible={isPopUpModalOpened}
        title={openedNotification?.title || 'Nexus Wallet'}
        text={
          openedNotification?.body ||
          'Welcome to Nexus - a non-custodial Litecoin wallet'
        }
        subText={openedNotification?.data?.subText || ''}
        buttonUrl={openedNotification?.data?.buttonUrl}
        close={() => closePopUpModalHandler()}
      />

      <ScheduledPopUpModal
        blocked={
          isTxDetailModalOpened ||
          isWalletsModalOpened ||
          isPinModalOpened ||
          isPopUpModalOpened
        }
        onGoToScreen={(routeParams, meta) => {
          if (meta.screen === 'Main' && routeParams.activeCard) {
            setActiveTab(routeParams.activeCard);
            setBottomSheetFolded(false);
            return true;
          }
          return false;
        }}
      />

      <LiquidGlassAlertModal
        isVisible={showRecoveryAlert}
        close={() => setRecoveryAlertDismissed(true)}
        titleTextKey={
          recoveryRestarted ? 'recovery_restarted_title' : 'recovery_sync_title'
        }
        textKey={recoveryRestarted ? 'recovery_restarted' : 'recovery_sync'}
        domain="modals"
        contentViewRef={mainContentRef}
      />

      <LoadingIndicator visible={loading} />
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: SHEET_BACKGROUND,
    },
    dragStrip: {
      width: '100%',
      height: screenHeight * DRAG_STRIP_HEIGHT_RATIO,
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
      height: screenHeight * TX_TITLE_ROW_HEIGHT_RATIO,
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
      <LiquidGlassWalletButton
        title={'Wallet Title'}
        onPress={() => {}}
        disabled={false}
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

export default NewMain;
