import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';

import AmountView from '../components/AmountView';
import AccountCell from '../components/Cells/AccountCell';
import LineChart from '../components/Chart/Chart';
import DatePicker from '../components/DatePicker';
import {formatDate, formatTime} from '../lib/utils/date';
import InfoCell from '../components/Cells/InfoCell';
import SendModal from '../components/Modals/SendModal';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {unsetDeeplink} from '../reducers/deeplinks';
import {decodeBIP21} from '../lib/utils/bip21';
import {sendOnchainPayment} from '../reducers/transaction';

type RootStackParamList = {
  Account: undefined;
  Wallet: undefined;
  Sent: {
    amount: number;
    address: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Account'>;
}

const Account: React.FC<Props> = props => {
  const {navigation} = props;

  const dispatch = useAppDispatch();
  const chartCursorDate = useAppSelector(state => state.chart.cursorDate);
  const chartCursorSelected = useAppSelector(
    state => state.chart.cursorSelected,
  );
  const {isInternetReachable} = useAppSelector(state => state.info);
  const {deeplinkSet, uri} = useAppSelector(state => state.deeplinks);

  const [isSendModalTriggered, triggerSendModal] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  // Deeplink handler
  useEffect(() => {
    if (deeplinkSet) {
      const decoded = decodeBIP21(uri);
      setAddress(decoded.address);

      // If additional data included, set amount/address
      if (decoded.options.amount) {
        // convert litecoin to satoshi
        setAmount(decoded.options.amount * 100000000);
        triggerSendModal(true);
      } else {
        // TODO: currently Send confirmation modal doesn't have UI
        // to modify an amount. Fail every URI without amount set.
        // After redesign take a look at this
        dispatch(unsetDeeplink());
        Alert.alert(
          'URI Invalid',
          'Plasma can only process URIs containing an amount',
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deeplink payment logic
  const handleConfirmSend: () => void = async () => {
    try {
      await dispatch(sendOnchainPayment(address, amount));
      dispatch(unsetDeeplink());
      triggerSendModal(false);
      navigation.navigate('Sent', {amount, address});
    } catch (error: unknown) {
      Alert.alert('Payment Failed', String(error));
      return;
    }
  };

  return (
    <View style={styles.container}>
      <AmountView>
        <LineChart />
        {chartCursorSelected ? (
          <Text style={styles.chartDateText}>
            {formatDate(chartCursorDate)} {formatTime(chartCursorDate)}
          </Text>
        ) : (
          <View style={styles.emptyTextView} />
        )}
        <DatePicker />
      </AmountView>
      <View style={styles.container}>
        <ScrollView>
          {!isInternetReachable ? (
            <>
              <Text style={styles.text}>Alerts</Text>
              <InfoCell text="Internet connection unavailable!" />
            </>
          ) : null}
          <Text style={styles.text}>Accounts</Text>
          <View style={styles.accountsContainer}>
            <AccountCell onPress={() => props.navigation.navigate('Wallet')} />
          </View>
        </ScrollView>
      </View>

      <SendModal
        isVisible={isSendModalTriggered}
        handleConfirm={() => handleConfirmSend()}
        close={() => {
          triggerSendModal(false);
          dispatch(unsetDeeplink());
        }}
        amount={amount}
        address={address}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  accountsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: '#7C96AE',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    paddingTop: 30,
    paddingLeft: 15,
    paddingBottom: 4,
  },
  chartDateText: {
    height: 13,
    opacity: 0.5,
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
  emptyTextView: {
    height: 13,
  },
});

export default Account;
