import React, {useRef, useState, useContext} from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import HeaderButton from '../../components/Buttons/HeaderButton';
// import {useAppSelector} from '../../store/hooks';
// import {groupTransactions} from '../../lib/utils/groupTransactions';
// import {txDetailSelector} from '../../reducers/transaction';
import TransactionDetailModal from '../../components/Modals/TransactionDetailModal';
import TransactionList from '../../components/TransactionList';
import FilterButton from '../../components/Buttons/FilterButton';
import SearchBar from '../../components/SearchBar';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  navigation: any;
}

const SearchTransaction: React.FC<Props> = props => {
  const {navigation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const TransactionListRef = useRef();

  const [txType, setTxType] = useState('All');
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);

  // const transactions = useAppSelector(state => txDetailSelector(state));
  // const groupedTransactions = groupTransactions(transactions);
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
    {value: 'All', imgSrc: require('../../assets/icons/blue-tick-oval.png')},
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
        }}
        key={element.value}
        imageSource={element.imgSrc}
        tint={element.value === 'All' ? false : true}
      />
    );
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [mwebFilter, setMwebFilter] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Pressable
          style={styles.mwebFilterBtn}
          onPress={() => setMwebFilter(!mwebFilter)}>
          <Text style={styles.mwebFilterBtnText}>
            {mwebFilter ? 'MWEB' : 'Regular'}
          </Text>
        </Pressable>
        <View style={styles.search}>
          <SearchBar
            value={searchFilter}
            placeholder={'Find a transaction'}
            onChangeText={text => setSearchFilter(text)}
          />
        </View>

        <View style={styles.filterContainer}>{Filter}</View>
      </View>

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
          searchFilter={searchFilter}
          mwebFilter={mwebFilter}
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
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1162E6',
      flexDirection: 'column',
    },
    headerTitle: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    mwebFilterBtn: {
      width: screenWidth * 0.35,
      height: screenHeight * 0.035,
      minHeight: 25,
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginHorizontal: screenWidth * 0.04,
      marginBottom: screenHeight * 0.011,
    },
    mwebFilterBtnText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
    },
    search: {
      width: '100%',
      paddingBottom: screenHeight * 0.01,
      paddingHorizontal: screenWidth * 0.04,
    },
    filters: {
      flexBasis: '25%',
      width: '100%',
      justifyContent: 'flex-end',
      paddingBottom: screenHeight * 0.01,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * 0.04,
    },
    txListContainer: {
      flexBasis: '75%',
      width: '100%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: '#fff',
      paddingTop: screenHeight * 0.03,
    },
  });

export const SearchTransactionNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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
