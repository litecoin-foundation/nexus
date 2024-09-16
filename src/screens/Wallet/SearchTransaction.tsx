import React, {useRef, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppSelector} from '../../store/hooks';
import {groupTransactions} from '../../lib/utils/groupTransactions';
import {txDetailSelector} from '../../reducers/transaction';
import TransactionDetailModal from '../../components/Modals/TransactionDetailModal';
import TransactionList from '../../components/TransactionList';
import FilterButton from '../../components/Buttons/FilterButton';

interface Props {}

const SearchTransaction: React.FC<Props> = props => {
  const {navigation} = props;
  const TransactionListRef = useRef();

  const transactions = useAppSelector(state => txDetailSelector(state));
  const groupedTransactions = groupTransactions(transactions);

  const [txType, setTxType] = useState('All');
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [sectionHeader, setSectionHeader] = useState(null);

  const filterTransactions = transactionType => {
    const txArray = [];

    switch (transactionType) {
      case 'Send':
        txArray.push(
          ...transactions.filter(tx => Math.sign(parseFloat(tx.amount)) === -1),
        );
        break;
      case 'Receive':
        txArray.push(
          ...transactions.filter(tx => Math.sign(parseFloat(tx.amount)) === 1),
        );
        break;
      case 'All':
        txArray.push(...transactions);
        break;
      default:
        txArray.push(...transactions);
        break;
    }

    setDisplayedTxs(groupTransactions(txArray));
  };

  const handleDatePick = (hash, timestamp) => {
    const dateIndex = diplayedTxs.findIndex(sections => {
      const {data} = sections;
      return data[0].hash === hash;
    });
    TransactionListRef.current.scrollToLocation(dateIndex);

    setSectionHeader(timestamp);
  };

  const filters = ['All', 'Buy', 'Sell', 'Convert', 'Send', 'Receive'];

  const Filter = filters.map(value => (
    <FilterButton
      title={value}
      active={txType === value ? true : false}
      onPress={() => {
        setTxType(value);
        filterTransactions(txType);
      }}
      key={value}
    />
  ));

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.filterContainer}>{Filter}</View>
        <View style={styles.txListContainer}>
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

        <TransactionDetailModal
          close={() => {
            setTxDetailModalVisible(false);
          }}
          isVisible={isTxDetailModalVisible}
          transaction={selectedTransaction}
          navigate={navigation.navigate}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1162E6',
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
  txListContainer: {
    height: 900,
    width: '100%',
    position: 'absolute',
    top: 200,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 19,
  },
  filterContainer: {
    paddingTop: 86,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
});

export const SearchTransactionNavigationOptions = navigation => {
  return {
    headerTitle: () => <Text style={styles.headerTitle}>Transactions</Text>,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default SearchTransaction;
