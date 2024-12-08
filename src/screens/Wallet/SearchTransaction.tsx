import React, {useRef, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import HeaderButton from '../../components/Buttons/HeaderButton';
// import {useAppSelector} from '../../store/hooks';
// import {groupTransactions} from '../../lib/utils/groupTransactions';
// import {txDetailSelector} from '../../reducers/transaction';
import TransactionDetailModal from '../../components/Modals/TransactionDetailModal';
import TransactionList from '../../components/TransactionList';
import FilterButton from '../../components/Buttons/FilterButton';

interface Props {
  navigation: any;
}

const SearchTransaction: React.FC<Props> = props => {
  const {navigation} = props;
  const TransactionListRef = useRef();

  // const transactions = useAppSelector(state => txDetailSelector(state));
  // const groupedTransactions = groupTransactions(transactions);

  const [txType, setTxType] = useState('All');
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);
  // const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);
  // const [sectionHeader, setSectionHeader] = useState(null);

  // const handleDatePick = (hash, timestamp) => {
  //   const dateIndex = diplayedTxs.findIndex(sections => {
  //     const {data} = sections;
  //     return data[0].hash === hash;
  //   });
  //   TransactionListRef.current.scrollToLocation(dateIndex);

  //   setSectionHeader(timestamp);
  // };

  const filters = [
    {value: 'All', imgSrc: require('../../assets/icons/sell-icon.png')},
    {value: 'Buy', imgSrc: require('../../assets/icons/buy-icon.png')},
    {value: 'Sell', imgSrc: require('../../assets/icons/sell-icon.png')},
    {value: 'Convert', imgSrc: require('../../assets/icons/convert-icon.png')},
    {value: 'Send', imgSrc: require('../../assets/icons/send-icon.png')},
    {value: 'Receive', imgSrc: require('../../assets/icons/receive-icon.png')},
  ];

  const Filter = filters.map(element => {
    return (
      <FilterButton
        title={element.value}
        active={txType === element.value ? true : false}
        onPress={() => {
          setTxType(element.value);
          // filterTransactions(txType);
        }}
        key={element.value}
        imageSource={element.imgSrc}
      />
    );
  });

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.filterContainer}>{Filter}</View>
        <View style={styles.txListContainer}>
          <TransactionList
            ref={TransactionListRef}
            onPress={(data: any) => {
              selectTransaction(data);
              setTxDetailModalVisible(true);
            }}
            // onViewableItemsChanged={viewableItems => {
            //   if (
            //     viewableItems.viewableItems !== undefined &&
            //     viewableItems.viewableItems.length >= 1
            //   ) {
            //     const {timestamp} = viewableItems.viewableItems[0].item;
            //     if (timestamp !== undefined) {
            //       setSectionHeader(timestamp);
            //     }
            //   }
            // }}
            transactionType={txType}
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
    paddingTop: 30,
  },
  filterContainer: {
    paddingTop: 86,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
});

export const SearchTransactionNavigationOptions = (navigation: any) => {
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
