import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

import {StackNavigationProp} from '@react-navigation/stack';
import NewAmountView from '../components/NewAmountView';
import LineChart from '../components/Chart/Chart';
import TransactionList from '../components/TransactionList';
import {txDetailSelector} from '../reducers/transaction';
import {groupBy} from '../lib/utils';
import SettingsCogsButton from '../components/Buttons/SettingsCogsButton';
import DashboardButton from '../components/Buttons/DashboardButton';

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

  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [sectionHeader, setSectionHeader] = useState(null);

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
        }}>
        <DashboardButton
          imageSource={require('../assets/icons/buy-icon.png')}
        />
        <DashboardButton
          imageSource={require('../assets/icons/sell-icon.png')}
        />
        <DashboardButton
          imageSource={require('../assets/icons/convert-icon.png')}
        />
        <DashboardButton
          imageSource={require('../assets/icons/send-icon.png')}
        />
        <DashboardButton
          imageSource={require('../assets/icons/receive-icon.png')}
        />
      </View>

      <View style={styles.transactionListContainer}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  transactionListContainer: {
    flex: 1,
    alignItems: 'center',
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
