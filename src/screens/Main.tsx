import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import {View, StyleSheet, Pressable, DeviceEventEmitter} from 'react-native';
import Animated, {SharedValue} from 'react-native-reanimated';
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
import {sleep} from '../utils/poll';
import {validate as validateLtcAddress} from '../utils/validate';
import {showError} from '../reducers/errors';

import {ScreenSizeContext} from '../context/screenSize';
import {useMainAnims} from '../animations/useMainAnims';
import {useMainLayout} from '../animations/useMainLayout';

interface URIHandlerRef {
  handleURI: (data: string) => void;
}

type RootStackParamList = {
  Main: {
    scanData?: string;
    isInitial?: boolean;
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
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
}

const TxListComponent: React.FC<TxListComponentProps> = props => {
  const {
    selectTransaction,
    setTxDetailModalOpened,
    foldUnfoldBottomSheet,
    isBottomSheetFolded,
    navigation,
    styles,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
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
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
      />
    </View>
  );
};

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const isInternetReachable = useAppSelector(
    state => state.info!.isInternetReachable,
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks!);

  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);
  const [isWalletsModalOpened, setWalletsModalOpened] = useState(false);
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
    }
  }, [route, foldUnfoldBottomSheet]);

  const [plasmaModalGapInPixels, setPlasmaModalGapInPixels] = useState(0);

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
  } = useMainAnims({isWalletsModalOpened, isTxDetailModalOpened});

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

      console.log(transaction);
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

    if (activeTab === 4) {
      callHandleURI();
      dispatch(unsetDeeplink());
    }
  }, [activeTab, uri, dispatch]);

  useMainLayout({
    walletButtonAnimDuration,
    rotateArrow,
    animatedHeaderButtonOpacity,
    animatedWalletButtonOpacity,
    animatedWalletButtonArrowRotation,
    currentWallet,
    activeTab,
    navigation,
    route,
    isWalletsModalOpened,
    setWalletsModalOpened,
    isTxDetailModalOpened,
    setPlasmaModalGapInPixels,
    setBottomSheetFolded,
    setActiveTab,
    manualPayment,
    isFlexaCustomer,
    styles,
  });

  // Components
  const HeaderComponent = useMemo(
    () => (
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
    ),
    [activeTab, isInternetReachable, styles.headerContainer],
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
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
      />
    ),
    [
      isBottomSheetFolded,
      navigation,
      styles,
      foldUnfoldBottomSheet,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
    ],
  );

  const BottomSheetMemo = useMemo(
    () => (
      <BottomSheet
        headerComponent={HeaderComponent}
        txViewComponent={TxListComponentMemo}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={foldUnfoldBottomSheet}
        activeTab={activeTab}
        buyViewComponent={<Buy navigation={navigation} />}
        sellViewComponent={<Sell navigation={navigation} />}
        convertViewComponent={<Convert navigation={navigation} />}
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
      foldUnfoldBottomSheet,
      activeTab,
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
  const plasmaModal_WalletsModalContent_backSpecifiedStyle = {
    backgroundColor: 'transparent',
  };
  const plasmaModal_PinModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(19,58,138, 0.6)',
  };

  return (
    <Animated.View style={[styles.container, animatedTopContainerBackground]}>
      <NewAmountView
        animatedProps={animatedTopContainerHeight}
        internetOpacityStyle={animatedChartOpacity}>
        <Animated.View style={[animatedChartOpacity, styles.chartContainer]}>
          {isBottomSheetFolded ? (
            <>
              <LineChart />
              <DatePicker />
            </>
          ) : null}
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
