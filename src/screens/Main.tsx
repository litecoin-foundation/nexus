import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import {View, StyleSheet, DeviceEventEmitter} from 'react-native';
import Animated from 'react-native-reanimated';
import {RouteProp, useIsFocused} from '@react-navigation/native';
import {useDrawerStatus} from '@react-navigation/drawer';
import {
  CUSTODY_MODEL,
  dismissAllModals,
  payment,
  TransactionRequest,
} from '@flexa/flexa-react-native';
import {StackNavigationOptions} from '@react-navigation/stack';

import TopSection, {TopSectionState} from '../components/TopSection';
import TopSectionMenu from '../components/TopSectionMenu';
import TopSectionChart from '../components/TopSectionChart';
import HeaderButton from '../components/Buttons/HeaderButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import Buy from '../components/Cards/Buy';
import Sell from '../components/Cards/Sell';
import PlasmaModal from './../components/Modals/PlasmaModal';
import TxDetailModalContent from './../components/Modals/TxDetailModalContent';
import BottomSheet from '../components/BottomSheet';
import TxListComponent from '../components/TxListComponent';
import LiquidGlassWalletButton from '../components/Buttons/LiquidGlassWalletButton';
import LiquidGlassWalletModal from './../components/Modals/LiquidGlassWalletModal';
import LiquidGlassAlertModal from '../components/Modals/LiquidGlassAlertModal';
import PinModalContent from '../components/Modals/PinModalContent';
import PopUpModal from '../components/Modals/PopUpModal';
import ScheduledPopUpModal from '../components/Modals/ScheduledPopUpModal';
import LoadingIndicator from '../components/LoadingIndicator';
// import Convert from '../components/Cards/Convert';
import GiftCardShop from '../components/Cards/GiftCardShop';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {sendOnchainPayment, txDetailSelector} from '../reducers/transaction';
import {unsetDeeplink, decodeAppDeeplink} from '../reducers/deeplinks';
import {setOpenedNotification} from '../reducers/settings';
import {sleep} from '../utils/poll';
import {validate as validateLtcAddress} from '../utils/validate';
import {showError} from '../reducers/errors';

import {ScreenSizeContext} from '../context/screenSize';
import {NavBarContext} from '../context/navBarContext';
import {useMainAnims} from '../animations/useMainAnims';
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

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getStyles();

  const isInternetReachable = useAppSelector(
    state => state.info!.isInternetReachable,
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks!);
  const {openedNotification} = useAppSelector(state => state.settings!);

  const dispatch = useAppDispatch();

  const drawerStatus = useDrawerStatus();
  const isShopAccountDrawerOpen = drawerStatus === 'open';

  const [activeTab, setActiveTab] = useState(0);
  const [topSectionState, setTopSectionState] =
    useState<TopSectionState>('menu');
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
  const [isPopUpModalOpened, setIsPopUpModalOpened] = useState(false);
  // const [currentWallet, setCurrentWallet] = useState('main_wallet');
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

  // Recovery-sync alert: shown while lnd is rescanning the chain to restore a
  // wallet. recoveryRestarted distinguishes a fresh recovery from one that was
  // auto-resumed after the app was closed mid-recovery.
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

  const [isBottomSheetFolded, setBottomSheetFolded] = useState(true);
  const foldUnfoldBottomSheet = useCallback((isFolded: boolean) => {
    if (isFolded) {
      setBottomSheetFolded(false);
    } else {
      setBottomSheetFolded(true);
      setActiveTab(0);
    }
  }, []);
  // Unfolding hides the top section, so reset it back to the menu.
  useEffect(() => {
    if (!isBottomSheetFolded) {
      setTopSectionState('menu');
    }
  }, [isBottomSheetFolded]);
  useEffect(() => {
    if (route.params?.isInitial) {
      foldUnfoldBottomSheet(false);
    } else if (route.params?.activeCard) {
      setActiveTab(route.params?.activeCard);
      setBottomSheetFolded(false);
    }
  }, [route, foldUnfoldBottomSheet]);

  // Handle PopUpModal
  const closePopUpModalHandler = useCallback(() => {
    setIsPopUpModalOpened(false);
    dispatch(setOpenedNotification(null));
  }, [dispatch]);
  useEffect(() => {
    if (!openedNotification) {
      return;
    }
    if (openedNotification?.data?.openUrl) {
      // openUrl takes precedence over the in-app popup: redirect to the
      // WebPage screen instead of showing the modal.
      navigation.navigate('WebPage', {uri: openedNotification.data.openUrl});
      dispatch(setOpenedNotification(null));
    } else if (openedNotification?.data?.showInAppPopUp === 'true') {
      setIsPopUpModalOpened(true);
    }
  }, [openedNotification, navigation, dispatch]);

  const [plasmaModalGapInPixels, setPlasmaModalGapInPixels] = useState(0);

  // Drawer toggle function
  const toggleShopAccountDrawer = useCallback(() => {
    if (activeTab === 3) {
      if (isShopAccountDrawerOpen) {
        navigation.closeDrawer?.();
      } else {
        navigation.openDrawer?.();
      }
    }
  }, [activeTab, isShopAccountDrawerOpen, navigation]);

  // Auto-close drawer when leaving Shop tab
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
    animatedTopContainerBackground,
    animatedTopContainerHeight,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
  } = useMainAnims({isWalletsModalOpened, isTxDetailModalOpened, activeTab});

  // Flexa
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

      // console.log(transaction);
      const addrArray = transaction.destinationAddress.split(':');

      // validation of destinationAddress
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
        // console.log(txid);
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
    },
    [dispatch, flexaAssetAccounts, handleAuthenticationRequired],
  );

  const manualPayment = useCallback(async () => {
    payment(flexaAssetAccounts, paymentCallback);
  }, [flexaAssetAccounts, paymentCallback]);

  // Transaction Detail Modal Swiping
  // const image = useImage(require('../assets/icons/search-icon.png'));
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

  // Deeplink handler
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
      // TODO: hacky way to ensure Send Card is mounted
      //       before calling handleURI().
      //       Handle this differently in the future?
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

  const handleNavBarPress = useCallback((tab: number) => {
    if (tab === 0) {
      setActiveTab(0);
      setBottomSheetFolded(true);
    } else {
      setActiveTab(tab);
      setBottomSheetFolded(false);
    }
  }, []);

  // NOTE: The glass nav bar is hosted at the App root (see navBarContext.tsx);
  // push Main's tab state up to it and hide it whenever Main is not the
  // screen the user is actually looking at.
  const isFocused = useIsFocused();
  const {setNavBarState} = useContext(NavBarContext);
  useEffect(() => {
    setNavBarState({
      visible:
        isFocused &&
        !isShopAccountDrawerOpen &&
        !isTxDetailModalOpened &&
        !isWalletsModalOpened &&
        !isPinModalOpened &&
        !isPopUpModalOpened &&
        !showRecoveryAlert,
      activeTab,
      sendDisabled: !isInternetReachable,
      onTabPress: handleNavBarPress,
    });
  }, [
    isFocused,
    isShopAccountDrawerOpen,
    isTxDetailModalOpened,
    isWalletsModalOpened,
    isPinModalOpened,
    isPopUpModalOpened,
    showRecoveryAlert,
    activeTab,
    isInternetReachable,
    handleNavBarPress,
    setNavBarState,
  ]);
  useEffect(() => {
    return () => {
      setNavBarState(prev => ({...prev, visible: false}));
    };
  }, [setNavBarState]);

  // Components
  const topSectionPage = useMemo(() => {
    return (
      <>
        {topSectionState === 'chart' ? (
          <TopSectionChart
            animatedOpacityStyle={animatedChartOpacity}
            isBottomSheetFolded={isBottomSheetFolded}
            triggerLester={triggerLester}
          />
        ) : null}
        <TopSectionMenu onTabPress={handleNavBarPress} />
      </>
    );
  }, [
    topSectionState,
    animatedChartOpacity,
    isBottomSheetFolded,
    triggerLester,
    handleNavBarPress,
  ]);

  const TxListComponentMemo = (
    <TxListComponent
      selectTransaction={selectTransaction}
      setTxDetailModalOpened={setTxDetailModalOpened}
      foldUnfoldBottomSheet={foldUnfoldBottomSheet}
      isBottomSheetFolded={isBottomSheetFolded}
      navigation={navigation}
      mainSheetsTranslationY={mainSheetsTranslationY}
      mainSheetsTranslationYStart={mainSheetsTranslationYStart}
    />
  );

  const BottomSheetMemo = useMemo(
    () => (
      <BottomSheet
        txViewComponent={TxListComponentMemo}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={foldUnfoldBottomSheet}
        activeTab={activeTab}
        topSectionState={topSectionState}
        buyViewComponent={<Buy navigation={navigation} />}
        sellViewComponent={<Sell navigation={navigation} />}
        // convertViewComponent={<Convert navigation={navigation} />}
        shopViewComponent={
          <GiftCardShop
            navigation={navigation}
            initialScreen={route.params?.shopScreen}
          />
        }
        sendViewComponent={
          <Send route={route} navigation={navigation} ref={sendCardRef} />
        }
        receiveViewComponent={<Receive />}
      />
    ),
    [
      TxListComponentMemo,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      isBottomSheetFolded,
      foldUnfoldBottomSheet,
      activeTab,
      topSectionState,
      route,
      navigation,
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
      style={[styles.container, animatedTopContainerBackground]}>
      <TopSection
        animatedProps={animatedTopContainerHeight}
        internetOpacityStyle={animatedChartOpacity}
        topSectionState={topSectionState}
        isBottomSheetFolded={isBottomSheetFolded}
        onOpenChart={() => setTopSectionState('chart')}
        onTriggerLester={() => setTriggerLester(prev => prev + 1)}>
        {topSectionPage}
      </TopSection>

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
        subText={
          openedNotification?.data?.subText ||
          // 'Dreamt up & brought to life with love and care by Litecoin Foundation x SquareBlack. Finish syncing to see your transactions.'
          ''
        }
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

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
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

export default Main;
