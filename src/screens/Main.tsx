import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
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
import {groupTransactions} from '../lib/utils/groupTransactions';
import {NativeStackScreenProps} from 'react-native-screens/lib/typescript/native-stack/types';
import BottomSheet from '../components/BottomSheet';
import TransactionList from '../components/TransactionList';
import {useAppDispatch} from '../store/hooks';

type RootStackParamList = {
  Main: {
    scanData?: string;
  };
};

interface Props extends NativeStackScreenProps<RootStackParamList, 'Main'> {}

const Main: React.FC<Props> = props => {
  const {navigation, route} = props;
  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupTransactions(transactions);

  const [activeTab, setActiveTab] = useState(0);

  const dispatch = useAppDispatch();

  const [selectedTransaction, selectTransaction] = useState(null);
  const [displayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);

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
        ['#1162E6', '#f7f7f7'],
      ),
    };
  });

  const shrinkHeaderOnButtonPress = () => {
    translationY.value = withSpring(-300, {mass: 0.5});
  };

  const expandHeaderOnButtonPress = () => {
    translationY.value = withSpring(-12, {mass: 0.5});
  };

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

  const txListComponent = (
    <TransactionList
      scrollOffset={scrollOffset}
      onPress={data => {
        selectTransaction(data);
        setTxDetailModalVisible(true);
      }}
      transactions={displayedTxs}
    />
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
      />
      <DashboardButton
        title="Convert"
        imageSource={require('../assets/icons/convert-icon.png')}
        handlePress={() => {
          console.log('dispatching gettxs');
          dispatch(getTransactions());
        }}
        active={activeTab === 3}
        textPadding={18}
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
      />
    </View>
  );

  return (
    <Animated.View
      style={[styles.container, animatedHeaderContainerBackground]}>
      <NewAmountView animatedProps={animatedHeaderHeight}>
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
    marginLeft: 20,
    marginRight: 20,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: 110,
  },
});

export const navigationOptions = navigation => {
  return {
    headerTitle: '',
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
      />
    ),
  };
};

export default Main;
