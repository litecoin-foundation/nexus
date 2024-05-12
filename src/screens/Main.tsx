import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, Platform, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {StackNavigationProp} from '@react-navigation/stack';
import {FlashList} from '@shopify/flash-list';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import {txDetailSelector} from '../reducers/transaction';
import HeaderButton from '../components/Buttons/HeaderButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import TransactionDetailModal from '../components/Modals/TransactionDetailModal';
import {groupTransactions} from '../lib/utils/groupTransactions';
import TransactionCell from '../components/Cells/TransactionCell';

type RootStackParamList = {
  Main: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
}

const Main: React.FC<Props> = props => {
  const {navigation} = props;
  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupTransactions(transactions);

  const [activeTab, setActiveTab] = useState(0);

  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);

  // Animation
  const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
  const translationY = useSharedValue(0);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translationY.value, [0, 90], [1, 0]),
    };
  });

  const animatedProp = useAnimatedProps(() => {
    return {
      height: interpolate(
        translationY.value,
        [0, 180],
        [350, 180],
        Extrapolation.CLAMP,
      ),
    };
  });

  const shrinkHeaderOnButtonPress = () => {
    translationY.value = withTiming(180);
  };

  const expandHeaderOnButtonPress = () => {
    translationY.value = withTiming(-10);
  };

  const scrollHandler = useAnimatedScrollHandler(event => {
    translationY.value = event.contentOffset.y;
  });

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
    <AnimatedFlashList
      onScroll={scrollHandler}
      data={groupedTransactions}
      estimatedItemSize={25}
      scrollEventThrottle={16}
      renderItem={({item}) => {
        if (typeof item === 'string') {
          // Rendering header
          return (
            <View
              style={{
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(214, 216, 218, 0.3)',
                backgroundColor: 'white',
                paddingLeft: 20,
              }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Satoshi Variable'
                      : 'SatoshiVariable-Regular.ttf',
                  fontStyle: 'normal',
                  fontWeight: '700',
                  color: '#747E87',
                  fontSize: 12,
                }}>
                {item}
              </Text>
            </View>
          );
        } else {
          // Render item
          return (
            <TransactionCell
              item={item}
              onPress={() => {
                selectTransaction(item);
                setTxDetailModalVisible(true);
              }}
            />
          );
        }
      }}
    />
  );

  let renderedCard;

  switch (activeTab) {
    case 0:
      renderedCard = txListComponent;
      break;
    case 4:
      renderedCard = <Send />;
      break;
    case 5:
      renderedCard = <Receive />;
      break;
  }

  return (
    <View style={styles.container}>
      <NewAmountView animatedProps={animatedProp}>
        <Animated.View style={animatedHeaderStyle}>
          <LineChart />
        </Animated.View>
      </NewAmountView>

      <View
        style={{
          marginLeft: 20,
          marginRight: 20,
          marginTop: 21,
          marginBottom: 21,
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
          handlePress={() => console.warn('Convert')}
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

      <View style={styles.cardContainer}>{renderedCard}</View>

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
