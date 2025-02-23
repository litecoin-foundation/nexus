import React, {useEffect, useState, useRef, useMemo, useContext} from 'react';
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
} from '@flexahq/flexa-react-native';

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
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {sendOnchainPayment, txDetailSelector} from '../reducers/transaction';
import {unsetDeeplink} from '../reducers/deeplinks';
import {sleep} from '../lib/utils/poll';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';
import PinModalContent from '../components/Modals/PinModalContent';
import {validate as validateLtcAddress} from '../lib/utils/validate';
import LoadingIndicator from '../components/LoadingIndicator';
import {showError} from '../reducers/errors';
import Convert from '../components/Cards/Convert';

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

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    testDeviceHeaderHeight,
  } = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {height: testDeviceHeaderHeight},
    });
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [testDeviceHeaderHeight]);

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
  const [currentWallet, setCurrentWallet] = useState('main_wallet');
  const uniqueId = useAppSelector(state => state.onboarding.uniqueId);
  const totalBalance = useAppSelector(state => state.balance.totalBalance);
  const confirmedBalance = useAppSelector(
    state => state.balance.confirmedBalance,
  );
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
  const image = useImage(require('../assets/icons/search-icon.png'));
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
      setBottomSheetFolded(false);
      setActiveTab(4);
    }
  }, [deeplinkSet]);

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
  }, [activeTab]);

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

  const backHeaderButton = useMemo(
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

  const leftHeaderButton = useMemo(
    () => (
      <Animated.View style={[styles.headerBtns, animatedButton]}>
        <HeaderButton
          onPress={() => navigation.navigate('SettingsStack')}
          imageSource={require('../assets/icons/settings-cog.png')}
        />
        <HeaderButton
          onPress={() => manualPayment()}
          imageSource={require('../assets/icons/shop.png')}
          marginLeft={SCREEN_WIDTH * 0.02 * -1}
        />
      </Animated.View>
    ),
    [animatedButton, navigation],
  );

  const rightHeaderButton = useMemo(
    () => (
      <Animated.View style={[styles.headerBtns, animatedButton]}>
        <HeaderButton
          onPress={() => navigation.navigate('AlertsStack')}
          imageSource={require('../assets/icons/charts-icon.png')}
          rightPadding={true}
        />
      </Animated.View>
    ),
    [animatedButton, navigation],
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

  const TxListComponent = (
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
        textPadding={8}
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
        textPadding={7}
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
        textPadding={18}
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
        textPadding={11}
        disabled={!isInternetReachable ? true : false}
      />
      <DashboardButton
        textKey="receive"
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
      <NewAmountView
        animatedProps={animatedHeaderHeight}
        internetOpacityStyle={animatedChartStyle}>
        <Animated.View style={[animatedChartStyle, styles.chartContainer]}>
          <LineChart />
          <DatePicker />
        </Animated.View>
      </NewAmountView>

      <BottomSheet
        headerComponent={HeaderComponent}
        txViewComponent={TxListComponent}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
        activeTab={activeTab}
        buyViewComponent={<Buy route={route} />}
        sellViewComponent={<Sell route={route} />}
        convertViewComponent={<Convert />}
        sendViewComponent={<Send route={route} ref={sendCardRef} />}
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
        gapInPixels={SCREEN_HEIGHT * 0.27}
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

      <PlasmaModal
        isOpened={isPinModalOpened}
        close={() => setIsPinModalOpened(false)}
        isFromBottomToTop={true}
        animDuration={250}
        gapInPixels={0}
        backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
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

export const navigationOptions = (navigation: any) => {
  return {
    headerStyle: {height: 103},
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
        imageSource={require('../assets/icons/charts-icon.png')}
        rightPadding={true}
      />
    ),
  };
};

export default Main;
