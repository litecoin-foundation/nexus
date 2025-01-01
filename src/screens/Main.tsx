import React, {useEffect, useState, useRef, useMemo, useContext} from 'react';
import {View, StyleSheet, Text, Pressable, Alert} from 'react-native';
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
import {Canvas, Image, RoundedRect, useImage} from '@shopify/react-native-skia';
import {payment, TransactionRequest} from '@flexahq/flexa-react-native';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import {txDetailSelector} from '../reducers/transaction';
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
import {useAppDispatch, useAppSelector} from '../store/hooks';
import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';
import {decodeBIP21} from '../lib/utils/bip21';
import {unsetDeeplink} from '../reducers/deeplinks';
import {validate as validateLtcAddress} from '../lib/utils/validate';
import {updateAmount} from '../reducers/input';
import SendModal from '../components/Modals/SendModal';
import DatePicker from '../components/DatePicker';

import {ScreenSizeContext} from '../context/screenSize';

const paymentCallback = (transactionRequest: TransactionRequest) => {
  //execute the transaction depending on parent app logic here
  const {transaction, transactionSent, transactionFailed} = transactionRequest;

  /* transaction contains
    destinationAddress: string; eip155:1:0x123... destination address for payment
    amount: string; // the fee price in decimals string representation
    feePriorityPrice: string; the fee priority price in decimals string representation
    feePrice: string; the fee price in decimals string representation
    size: string; // transaction size bigint (i.e. gasLimit)
    assetId: string; // assetId CAIP19 notation of the asset that is to be sent
    accountId: string; // which accountId was used for the payment (i.e which wallet to send from)
  */

  // const TX_SIGNATURE = yourTransactionSendFunction({ ...transaction });
  const TX_SIGNATURE = null;

  // This helps Flexa confirm the transaction quickly for self-custody wallets. It is a callback sent back to the SDK with the transaction signature i.e hash
  transactionSent(TX_SIGNATURE);

  // Or call transactionFailed to close the commerce session initiated in the Flexa SDK
  transactionFailed();
};

const flexaAssetAccounts = [
  {
    displayName: 'Main Wallet',
    accountId: 'flexa_uuid_here', // TODO
    custodyModel: 'LOCAL',
    availableAssets: [
      {
        assetId: 'bip122:12a765e31ffd4059bada1e25190f6e98',
        symbol: 'LTC',
        displayName: 'Litecoin',
        balance: 0.5,
        balanceAvailable: 0.5,
        icon: 'https://cdn.myweb/ethLogoURL.png',
      },
    ],
  },
];

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
  const [isSendModalTriggered, triggerSendModal] = useState<boolean>(false);
  const [selectedTransaction, selectTransaction] = useState<any>({});
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
          dispatch(updateAmount(decoded.options.amount, 'ltc'));
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

  const manualPayment = async () => {
    payment(flexaAssetAccounts, paymentCallback);
  };

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
        <Text style={styles.txTitleText}>Latest Transactions</Text>

        <Pressable onPress={() => navigation.navigate('SearchTransaction')}>
          <Canvas style={styles.txSearchBtnCanvas}>
            <RoundedRect
              x={0}
              y={0}
              width={SCREEN_HEIGHT * 0.09}
              height={SCREEN_HEIGHT * 0.05}
              color="white"
              r={SCREEN_HEIGHT * 0.01}
            />
            <Image
              image={image}
              x={SCREEN_HEIGHT * 0.02}
              y={SCREEN_HEIGHT * 0.016}
              width={SCREEN_HEIGHT * 0.017}
              height={SCREEN_HEIGHT * 0.016}
            />
          </Canvas>
        </Pressable>
      </View>
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
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
      height: screenHeight * 0.07,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    txTitleText: {
      paddingLeft: screenHeight * 0.019,
      paddingBottom: screenHeight * 0.012,
      paddingTop: screenHeight * 0.005,
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.024,
    },
    txSearchBtnCanvas: {
      width: screenHeight * 0.06,
      height: screenHeight * 0.05,
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
