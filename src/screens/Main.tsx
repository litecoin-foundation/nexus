import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, Text, Platform, Pressable, Dimensions} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import {getTransactions, txDetailSelector} from '../reducers/transaction';
import HeaderButton from '../components/Buttons/HeaderButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import Buy from '../components/Cards/Buy';
import Sell from '../components/Cards/Sell';
import TransactionDetailModal from '../components/Modals/TransactionDetailModal';
import PlasmaModal from '../components/Modals/PlasmaModal';
import WalletsModalContent from '../components/Modals/WalletsModalContent';
import {groupTransactions} from '../lib/utils/groupTransactions';
import {NativeStackScreenProps} from 'react-native-screens/lib/typescript/native-stack/types';
import BottomSheet from '../components/BottomSheet';
import TransactionList from '../components/TransactionList';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  Canvas,
  RoundedRect,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import {finishOnboarding} from '../reducers/onboarding';

import ChooseWalletButton from '../components/Buttons/ChooseWalletButton';

const fontFamily =
  Platform.OS === 'ios' ? 'Satoshi Variable' : 'SatoshiVariable-Regular.ttf';
const fontStyle = {
  fontFamily,
  fontStyle: 'normal',
  fontWeight: '700',
};
const font = matchFont(fontStyle);

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
  SearchTransaction: undefined;
};

interface Props extends NativeStackScreenProps<RootStackParamList, 'Main'> {}

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;
  const {isInternetReachable} = useAppSelector(state => state.info);
  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupTransactions(transactions);

  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransaction, selectTransaction] = useState(null);
  const [displayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [isWalletsModalVisible, setWalletsModalVisible] = useState(false);
  const [currentWallet, setCurrentWallet] = useState('Main wallet');

  // Animation
  const translationY = useSharedValue(0);
  const bottomSheetTranslateY = useSharedValue(350);
  const scrollOffset = useSharedValue(0);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(250, translateY);
    const clampedTranslateY = Math.min(350, minTranslateY);
    return {
      opacity: interpolate(clampedTranslateY, [250, 350], [0, 1]),
    };
  });

  const animatedHeaderHeight = useAnimatedProps(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(250, translateY);
    const clampedTranslateY = Math.min(350, minTranslateY);
    return {
      height: clampedTranslateY,
      borderBottomLeftRadius: interpolate(
        clampedTranslateY,
        [250, 350],
        [0, 40],
      ),
      borderBottomRightRadius: interpolate(
        clampedTranslateY,
        [250, 350],
        [1, 40],
      ),
    };
  });

  const animatedHeaderContainerBackground = useAnimatedStyle(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(250, translateY);
    const clampedTranslateY = Math.min(350, minTranslateY);
    return {
      backgroundColor: interpolateColor(
        clampedTranslateY,
        [250, 350],
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
  }, [activeTab]);

  const [plasmaModalGapInPixels, setPlasmaModalGapInPixels] = useState(0);
  useEffect(() => {
    if (isWalletsModalVisible) {
      navigation.setOptions({
          headerLeft: () => (<></>),
          headerRight: () => (<></>),
      });
    } else {
      navigation.setOptions({
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
      });
    }
    navigation.setOptions({
      headerTitle: () => (
        <View
        onLayout={event => {
          event.target.measure((x, y, width, height, pageX, pageY) => {
            setPlasmaModalGapInPixels(height + pageY);
          });
        }}
        >
        <ChooseWalletButton
          value={currentWallet}
          onPress={() => {setWalletsModalVisible(!isWalletsModalVisible);}}
          disabled={false}
          customStyles={isWalletsModalVisible ? styles.chooseWalletButton : {}}
          isBottomCurvesEnabled={isWalletsModalVisible}
          isModalOpened={isWalletsModalVisible}
        />
        </View>
      ),
    });
  }, [currentWallet, isWalletsModalVisible]);

  const txListComponent = (
    <View>
      <View
        style={{
          height: 70,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            paddingLeft: 19,
            paddingBottom: 12,
            paddingTop: 5,
            fontFamily:
              Platform.OS === 'ios'
                ? 'Satoshi Variable'
                : 'SatoshiVariable-Regular.ttf',
            fontStyle: 'bold',
            fontWeight: '700',
            color: '#2E2E2E',
            fontSize: 24,
          }}>
          Latest Transactions
        </Text>

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
          setTxDetailModalVisible(true);
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
      <NewAmountView animatedProps={animatedHeaderHeight} currentWallet={currentWallet} openWallets={() => {setWalletsModalVisible(true);}}>
        <Animated.View style={animatedHeaderStyle}>
          <LineChart />
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

      <TransactionDetailModal
        close={() => {
          setTxDetailModalVisible(false);
        }}
        isVisible={isTxDetailModalVisible}
        transaction={selectedTransaction}
        navigate={navigation.navigate}
      />

      <PlasmaModal
        isVisible={isWalletsModalVisible}
        isFromBottomToTop={false}
        close={() => {
          setWalletsModalVisible(false);
        }}
        gapInPixels={plasmaModalGapInPixels}
        contentBodySpecifiedStyle={{borderTopLeftRadius: 30, borderTopRightRadius: 30}}
      >
        <WalletsModalContent
          // isVisible={isWalletsModalVisible}
          // close={() => {
          //   setWalletsModalVisible(false);
          // }}
          currentWallet={currentWallet}
        />
      </PlasmaModal>
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
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: 110,
  },
  chooseWalletButton: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: Dimensions.get('screen').height * 0.01,
    borderTopRightRadius: Dimensions.get('screen').height * 0.01,
  },
});

export const navigationOptions = (navigation) => {
  return {
    headerTitle: () => (
      <ChooseWalletButton
        value="Wallet Title"
        onPress={() => {}}
        disabled={false}
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
