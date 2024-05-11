import React, {useRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useSelector} from 'react-redux';

import {StackNavigationProp} from '@react-navigation/stack';
import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import TransactionList from '../components/TransactionList';
import {txDetailSelector} from '../reducers/transaction';
import {groupBy} from '../lib/utils';
import SettingsCogsButton from '../components/Buttons/SettingsCogsButton';
import DashboardButton from '../components/Buttons/DashboardButton';
import Receive from '../components/Cards/Receive';
import Send from '../components/Cards/Send';

type RootStackParamList = {
  Main: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
}

const Main: React.FC<Props> = props => {
  const TransactionListRef = useRef();
  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupBy(transactions, 'day');

  const [activeTab, setActiveTab] = useState(0);

  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [sectionHeader, setSectionHeader] = useState(null);

  const txListComponent = (
    <TransactionList
      ref={TransactionListRef}
      onPress={data => {
        selectTransaction(data);
        setTxDetailModalVisible(true);
      }}
      transactions={diplayedTxs}
      onViewableItemsChanged={viewableItems => {
        if (
          viewableItems.viewableItems !== undefined &&
          viewableItems.viewableItems.length >= 1
        ) {
          const {timestamp} = viewableItems.viewableItems[0].item;
          if (timestamp !== undefined) {
            setSectionHeader(timestamp);
          }
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
      <NewAmountView>
        <LineChart />
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
        />
        <DashboardButton
          title="Sell"
          imageSource={require('../assets/icons/sell-icon.png')}
          handlePress={() => console.warn('Sell')}
          active={activeTab === 2}
        />
        <DashboardButton
          title="Convert"
          imageSource={require('../assets/icons/convert-icon.png')}
          handlePress={() => console.warn('Convert')}
          active={activeTab === 3}
        />
        <DashboardButton
          title="Send"
          imageSource={require('../assets/icons/send-icon.png')}
          handlePress={() => setActiveTab(4)}
          active={activeTab === 4}
        />
        <DashboardButton
          title="Receive"
          imageSource={require('../assets/icons/receive-icon.png')}
          handlePress={() => setActiveTab(5)}
          active={activeTab === 5}
        />
      </View>
      <View style={styles.cardContainer}>{renderedCard}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  cardContainer: {
    flex: 1,
    marginTop: 25,
  },
});

export const navigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerLeft: () => (
      <SettingsCogsButton
        onPress={() => navigation.navigate('SettingsStack')}
      />
    ),
  };
};

export default Main;
