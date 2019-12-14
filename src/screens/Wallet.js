import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from 'react-navigation-hooks';
import LinearGradient from 'react-native-linear-gradient';

import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import AmountView from '../components/AmountView';

const Wallet = () => {
  const {navigate} = useNavigation();

  const [isTxTypeModalVisible, setTxTypeModalVisible] = useState(false);
  const [isTxDetailModalVisible, setTxDetailModalVisible] = useState(false);
  const [selectedTransaction, selectTransaction] = useState(null);

  return (
    <LinearGradient
      colors={['#F6F9FC', 'rgba(210,225,239,0)']}
      style={styles.container}>
      <AmountView />
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalVisible(true);
        }}
      />

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
            onPress={() => {
              navigate('Send');
            }}>
            <Image
              style={styles.image}
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
              style={styles.image}
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
        navigate={navigate}
        close={() => setTxTypeModalVisible(false)}
      />

      <TransactionDetailModal
        close={() => {
          setTxDetailModalVisible(false);
        }}
        isVisible={isTxDetailModalVisible}
        transaction={selectedTransaction}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
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
  image: {
    height: 24,
    width: 25,
    position: 'absolute',
    left: 14,
  },
  left: {
    left: 7,
  },
});

Wallet.navigationOptions = {
  headerTitle: 'LTC Wallet',
  tabBarVisible: false,
  headerTitleStyle: {
    fontWeight: 'bold',
    color: 'white',
  },
  headerTransparent: true,
  headerBackTitle: null,
};

export default Wallet;
