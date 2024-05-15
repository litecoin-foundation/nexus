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
  withTiming,
} from 'react-native-reanimated';

import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import {txDetailSelector} from '../reducers/transaction';
import HeaderButton from '../components/Buttons/HeaderButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';
import TransactionDetailModal from '../components/Modals/TransactionDetailModal';
import {groupTransactions} from '../lib/utils/groupTransactions';
import {NativeStackScreenProps} from 'react-native-screens/lib/typescript/native-stack/types';
import BottomSheet from '../components/BottomSheet';
import TransactionList from '../components/TransactionList';

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

  const dummyData = [
    {
      title: 'March 18',
      data: [
        {
          hash: '37cd32e79c83c0c7cb4a69788be6d0b744025db2995894655c5d9e95e4a5bfe6',
          amount: 5356200,
          day: 'March 18',
          time: '09:21',
          timestamp: 1710753689,
          confs: 31055,
          lightning: false,
          addresses: [
            'ltc1gl4rawa8wnjd8zlpja4tp0sxjngfr2r0x8x7e3ehctkgj94m0kq9sq836zu',
            'ltc1qszce8048rpg6uygxy2nqlnzscuc52l0j2s7f2a',
          ],
          sent: false,
        },
        {
          hash: '6b10fa3b38c50fbf8cf03a22b83dfc038c83dfeb8b8e3b2ef4c2d192320dd8ab',
          amount: 2754300,
          day: 'March 18',
          time: '14:45',
          timestamp: 1710785700,
          confs: 28144,
          lightning: true,
          addresses: ['ltc1qg5uawu3tzp7ykw7amq3wsprl37sgu8tq9pfgr'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 19',
      data: [
        {
          hash: 'f9a4c8d8b9d189a67a11cb7f6b6c8e1211b10d48d1f3993aaed0bea31604895d',
          amount: 8219000,
          day: 'March 19',
          time: '10:12',
          timestamp: 1710888720,
          confs: 20731,
          lightning: false,
          addresses: ['ltc1qlv42ltcavmp4c2v2lm8t69hz7rr6zuvzd0zlv4'],
          sent: true,
        },
        {
          hash: 'c6b6fe02f8943a9e0b5cf0440b41cb550d7a7005b3e7e12d85de76e01bea41a5',
          amount: 4802100,
          day: 'March 19',
          time: '17:30',
          timestamp: 1710911400,
          confs: 15280,
          lightning: true,
          addresses: ['ltc1q6x6mmqk4ysv3e4jftcrw6ntquvfv9qz9wzvcx'],
          sent: false,
        },
      ],
    },
    {
      title: 'March 20',
      data: [
        {
          hash: 'b7a869d5b70e16e79320e9321931e7643948230a2f8c583c3f3c8d86d71d76c5',
          amount: 10234000,
          day: 'March 20',
          time: '08:35',
          timestamp: 1710985130,
          confs: 12300,
          lightning: true,
          addresses: ['ltc1qj5pmcpglvtr54ucfwz73z43m7cr0wmm6d5utp'],
          sent: false,
        },
        {
          hash: '69e3c4c89d27a79dc07a0ed3df58259e2d9b8fd6c27d0b4932f91f5b56beeb36',
          amount: 7312000,
          day: 'March 20',
          time: '15:20',
          timestamp: 1711015200,
          confs: 16789,
          lightning: false,
          addresses: ['ltc1q6x6mmqk4ysv3e4jftcrw6ntquvfv9qz9wzvcx'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 21',
      data: [
        {
          hash: '1a431b1f009d8760817e1de8dd0b11c9a1740b8a17d1e79b9c3808e164a0238a',
          amount: 920000,
          day: 'March 21',
          time: '12:05',
          timestamp: 1711077900,
          confs: 10798,
          lightning: false,
          addresses: ['ltc1q0t6e33p3qlqtpzwj7jyngq6w6cqt2l5srqtrz'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 22',
      data: [
        {
          hash: '5cb625d943ab13cc9b59193c69d41b16915a86c5a4bcf59ab87b76031c9008e7',
          amount: 5400000,
          day: 'March 22',
          time: '09:35',
          timestamp: 1711164900,
          confs: 9987,
          lightning: true,
          addresses: ['ltc1qfc56e2unghhqrw9pg6lr8ht9pzhw75x3ue5e7j'],
          sent: false,
        },
        {
          hash: 'f2a935a23bb1baf17749bcb8e04e5b747c4f3b76c235f8f7d84071fd98db593e',
          amount: 3982000,
          day: 'March 22',
          time: '16:20',
          timestamp: 1711190400,
          confs: 8712,
          lightning: false,
          addresses: ['ltc1q4xgeaf5rzkgjtpg2z5lw3n0xhv0et7t0mfhmt'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 23',
      data: [
        {
          hash: '8c0369cb4cfcad3c706d5b6e8bceefcf563aa7476718d54e0eb73210fc8a8768',
          amount: 620000,
          day: 'March 23',
          time: '11:10',
          timestamp: 1711247400,
          confs: 7894,
          lightning: true,
          addresses: ['ltc1qqecfupjgl9wrhm3ce2e0fxq2y3l36lwjzps64s'],
          sent: false,
        },
        {
          hash: '7b5b77d90a3f682e9f2e9c9935b6ac44fa6d73b62cb1e75d8d97d4b08a0635e7',
          amount: 290000,
          day: 'March 23',
          time: '18:45',
          timestamp: 1711279500,
          confs: 6543,
          lightning: false,
          addresses: ['ltc1qr35mhxjkmtpqagtcz3kev0chdahyf0wyhe0y3y'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 24',
      data: [
        {
          hash: 'fd31cf0879826fbfe5bbda156bb6d77c64e7c2eebe9f50b9bcfdcb0ab132f052',
          amount: 870000,
          day: 'March 24',
          time: '10:20',
          timestamp: 1711328400,
          confs: 5678,
          lightning: true,
          addresses: ['ltc1qlajyqpmv7w9ar40s4df75rnmh88evqekhpy4qu'],
          sent: false,
        },
      ],
    },
    {
      title: 'March 25',
      data: [
        {
          hash: 'ebac116472a55eb2811297e222f24620a39a073edc3a054f8b7f91d707c9c070',
          amount: 720000,
          day: 'March 25',
          time: '12:30',
          timestamp: 1711404600,
          confs: 4567,
          lightning: false,
          addresses: ['ltc1q7kfgshzvpsm63wsgm72khkm2elqgjut4f8s6x'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 26',
      data: [
        {
          hash: '218a49c2de4016a6d5d1aa15a4b7ef2a3bdf0cb3c0db2240f8788ecdc0f0f5de',
          amount: 630000,
          day: 'March 26',
          time: '09:45',
          timestamp: 1711481100,
          confs: 3456,
          lightning: true,
          addresses: ['ltc1qtm7n4gpd9m4tlyvfnv2k8hngrg5q3v85e9at9'],
          sent: false,
        },
      ],
    },
    {
      title: 'March 27',
      data: [
        {
          hash: 'ce6a42cb612d04d54268fc4d5aef9f03cdca3b8ef5643609a5f1a64cc3a4d426',
          amount: 980000,
          day: 'March 27',
          time: '10:55',
          timestamp: 1711557300,
          confs: 2345,
          lightning: false,
          addresses: ['ltc1qmqglrps2zdnsgf3l6dmz88lvfgl89yq9gejmt'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 28',
      data: [
        {
          hash: '4c43017e44c41a4f3841e49e5cf9cdd93ff773ea3fb3de8b2045e7897c3e294a',
          amount: 550000,
          day: 'March 28',
          time: '11:15',
          timestamp: 1711634100,
          confs: 1234,
          lightning: true,
          addresses: ['ltc1q95weu4eyf8nm0rpx0t07xnrhzfz03cq2v7zmrg'],
          sent: false,
        },
      ],
    },
    {
      title: 'March 29',
      data: [
        {
          hash: '5c526402f4fe3f30b81a36fc1d6c4824bb192607fd00736ff11a2d50c1a30768',
          amount: 470000,
          day: 'March 29',
          time: '13:25',
          timestamp: 1711721100,
          confs: 1011,
          lightning: false,
          addresses: ['ltc1qcctcmhnrvvcrnsu8f8ezwyj4rctpmnfxdrmrj'],
          sent: true,
        },
      ],
    },
    {
      title: 'March 30',
      data: [
        {
          hash: '6da302cb15fc1421ad565e59c64cd0be37f06c9964b5e720bdfb031d2f724b89',
          amount: 310000,
          day: 'March 30',
          time: '14:35',
          timestamp: 1711808100,
          confs: 789,
          lightning: true,
          addresses: ['ltc1q5e4e6d4plvkxtl8zgl7s9u54n8ct9apjffp4mz'],
          sent: false,
        },
      ],
    },
    // Add more data for additional days if needed
  ];

  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(dummyData);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);

  // Animation
  const translationY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(-translationY.value, [0, 90], [1, 0]),
    };
  });

  const animatedProp = useAnimatedProps(() => {
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
      transactions={[]}
    />
  );

  let renderedCard;

  switch (activeTab) {
    case 0:
      renderedCard = txListComponent;
      break;
    case 4:
      renderedCard = <Send route={route} />;
      break;
    case 5:
      renderedCard = <Receive />;
      break;
  }

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
        handlePress={() => console.warn('Convert')}
        active={activeTab === 3}
        imageContainerStyle={{paddingTop: 15}}
      />
      <DashboardButton
        title="Send"
        imageSource={require('../assets/icons/send-icon.png')}
        handlePress={() => {
          console.log('poopt');
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
      <NewAmountView animatedProps={animatedProp}>
        <Animated.View style={animatedHeaderStyle}>
          <LineChart />
        </Animated.View>
      </NewAmountView>

      <BottomSheet
        headerComponent={HeaderComponent}
        translationY={translationY}
        scrollOffset={scrollOffset}
        handleSwipeDown={() => setActiveTab(0)}>
        {renderedCard}
      </BottomSheet>

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
