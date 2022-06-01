import React, {useState, useLayoutEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {HeaderBackButton} from '@react-navigation/elements';
import {useSelector} from 'react-redux';

import TransactionDetailModal from '../components/Modals/TransactionDetailModal';
import TransactionModal from '../components/Modals/TransactionModal';
import TransactionList from '../components/TransactionList';
import AmountView from '../components/AmountView';
import InfoModal from '../components/Modals/InfoModal';
import SearchButton from '../components/Buttons/SearchButton';
import TransactionFilterModal from '../components/Modals/TransactionFilterModal';
import {groupBy} from '../lib/utils';
import {txDetailSelector} from '../reducers/transaction';

const Wallet = props => {
  const {navigation} = props;

  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupBy(transactions, 'day');

  const [isTxTypeModalVisible, setTxTypeModalVisible] = useState(false);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [isInternetModalVisible, setInternetModalVisible] = useState(false);
  const [isTxFilterModalVisible, setTxFilterModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);
  const {isInternetReachable} = useSelector(state => state.info);
  const [diplayedTxs, setDisplayedTxs] = useState(groupedTransactions);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <SearchButton onPress={() => setTxFilterModalVisible(true)} />
      ),
    });
  }, [navigation]);

  const handleSendPress = () => {
    if (!isInternetReachable) {
      setInternetModalVisible(true);
      return;
    }
    navigation.navigate('Send');
  };

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

    setDisplayedTxs(groupBy(txArray, 'day'));
    setTxFilterModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <AmountView small={true} />
      <View style={styles.transactionListContainer}>
        <TransactionList
          onPress={data => {
            selectTransaction(data);
            setTxDetailModalVisible(true);
          }}
          transactions={diplayedTxs}
        />
      </View>

      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        style={styles.paymentContainer}>
        <LinearGradient
          colors={['#FF415E', '#FF9052']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.paymentButton}>
          <TouchableOpacity
            style={styles.paymentButtonContainer}
            onPress={handleSendPress}>
            <Image
              style={styles.sendImage}
              source={require('../assets/images/send-white.png')}
            />
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentText}>SEND</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <LinearGradient
          colors={['#7E58FF', '#0D59EA']}
          style={styles.paymentButton}>
          <TouchableOpacity
            style={styles.paymentButtonContainer}
            onPress={() => {
              setTxTypeModalVisible(true);
            }}>
            <Image
              style={styles.receiveImage}
              source={require('../assets/images/receive-white.png')}
            />
            <View style={styles.paymentTextContainer}>
              <Text style={[styles.paymentText, styles.left]}>RECEIVE</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>

      <TransactionModal
        isVisible={isTxTypeModalVisible}
        navigate={navigation.navigate}
        close={() => setTxTypeModalVisible(false)}
      />

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

      <InfoModal
        isVisible={isInternetModalVisible}
        close={() => setInternetModalVisible(false)}
        textColor="red"
        text="No network connection!"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  paymentContainer: {
    paddingTop: 30,
    paddingBottom: 30,
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-evenly',
  },
  paymentButton: {
    height: 50,
    width: 150,
    borderRadius: 25,
  },
  paymentButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -0.32,
    textAlign: 'center',
  },
  sendImage: {
    height: 24,
    width: 25,
    position: 'absolute',
    left: 14,
  },
  receiveImage: {
    height: 23,
    width: 25,
    position: 'absolute',
    left: 14,
  },
  left: {
    left: 7,
  },
  transactionListContainer: {
    paddingTop: 25,
  },
  headerLeftMargin: {
    marginLeft: 22,
  },
});

Wallet.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'LTC Wallet',
    tabBarVisible: false,
    headerLeft: () => (
      <View style={styles.headerLeftMargin}>
        <HeaderBackButton
          tintColor="white"
          labelVisible={false}
          onPress={() => navigation.goBack()}
        />
      </View>
    ),
  };
};

export default Wallet;
