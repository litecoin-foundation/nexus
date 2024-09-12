import React, {useRef, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppSelector} from '../../store/hooks';
import {groupTransactions} from '../../lib/utils/groupTransactions';
import {txDetailSelector} from '../../reducers/transaction';
import TransactionFilterModal from '../../components/Modals/TransactionFilterModal';
import TransactionDetailModal from '../../components/Modals/TransactionDetailModal';
import TransactionList from '../../components/TransactionList';

interface Props {}

const SearchTransaction: React.FC<Props> = props => {
  const {navigation} = props;
  const TransactionListRef = useRef();

  const transactions = useAppSelector(state => txDetailSelector(state));
  const groupedTransactions = groupTransactions(transactions);

  const [isTxTypeModalVisible, setTxTypeModalVisible] = useState(false);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [isTxFilterModalVisible, setTxFilterModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  const [sectionHeader, setSectionHeader] = useState(null);

  const filterTransactions = (transactionType, lightning, searchQuery) => {
    const txArray = [];

    if (transactionType === 0) {
      txArray.push(...transactions);
    }
    if (transactionType === 1) {
      txArray.push(
        ...transactions.filter(tx => Math.sign(parseFloat(tx.amount)) === -1),
      );
    }
    if (transactionType === 2) {
      txArray.push(
        ...transactions.filter(tx => Math.sign(parseFloat(tx.amount)) === 1),
      );
    }
    if (lightning) {
      // currently unhandled
    }
    if (searchQuery) {
      // currently unhandled
    }

    setDisplayedTxs(groupTransactions(txArray));
    setTxFilterModalVisible(false);
  };

  const handleDatePick = (hash, timestamp) => {
    const dateIndex = diplayedTxs.findIndex(sections => {
      const {data} = sections;
      return data[0].hash === hash;
    });
    TransactionListRef.current.scrollToLocation(dateIndex);

    setSectionHeader(timestamp);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text>SearchTransaction</Text>

        <View>
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

        <TransactionFilterModal
          close={() => {
            setTxFilterModalVisible(false);
          }}
          isVisible={isTxFilterModalVisible}
          onPress={(txType, lightning, searchField) =>
            filterTransactions(txType, lightning, searchField)
          }
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
