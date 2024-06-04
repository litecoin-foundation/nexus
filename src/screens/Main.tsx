import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {
  Extrapolation,
  interpolate,
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
  const scrollOffset = useSharedValue(0);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(-translationY.value, [0, 90], [1, 0]),
    };
  });

  const animatedHeaderHeight = useAnimatedProps(() => {
    return {
      height: interpolate(
        -translationY.value,
        [0, 180],
        [350, 180],
        Extrapolation.CLAMP,
      ),
    };
  });

  const shrinkHeaderOnButtonPress = () => {
    translationY.value = withSpring(-300, {mass: 0.5});
  };

  const expandHeaderOnButtonPress = () => {
    translationY.value = withSpring(-10, {mass: 0.5});
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
    <View
      style={{
        marginLeft: 20,
        marginRight: 20,
        marginTop: 18,
        marginBottom: 42,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        height: 50,
      }}>
      <DashboardButton
        title="Buy"
        imageSource={require('../assets/icons/buy-icon.png')}
        handlePress={() => console.warn('Buy')}
        active={activeTab === 1}
        imageContainerStyle={{paddingTop: 17}}
      />
      <DashboardButton
        title="Sell"
        imageSource={require('../assets/icons/sell-icon.png')}
        handlePress={() => console.warn('Sell')}
        active={activeTab === 2}
        imageContainerStyle={{paddingTop: 17}}
      />
      <DashboardButton
        title="Convert"
        imageSource={require('../assets/icons/convert-icon.png')}
        handlePress={() => {
          console.log('dispatching gettxs');
          dispatch(getTransactions());
          console.log(transactions);
        }}
        active={activeTab === 3}
        imageContainerStyle={{paddingTop: 15}}
      />
      <DashboardButton
        title="Send"
        imageSource={require('../assets/icons/send-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(4);
        }}
        active={activeTab === 4}
        imageContainerStyle={{paddingTop: 14}}
      />
      <DashboardButton
        title="Receive"
        imageSource={require('../assets/icons/receive-icon.png')}
        handlePress={() => {
          shrinkHeaderOnButtonPress();
          setActiveTab(5);
        }}
        active={activeTab === 5}
        imageContainerStyle={{paddingTop: 15}}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <NewAmountView animatedProps={animatedHeaderHeight}>
        <Animated.View style={animatedHeaderStyle}>
          <LineChart />
        </Animated.View>
      </NewAmountView>

      <BottomSheet
        headerComponent={HeaderComponent}
        translationY={translationY}
        scrollOffset={scrollOffset}
        handleSwipeDown={() => setActiveTab(0)}
        activeTab={activeTab}
        txViewComponent={txListComponent}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  cardContainer: {
    flexGrow: 1,
    alignSelf: 'stretch',
    marginTop: 25,
    bottom: 0,
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
  };
};

export default Main;
