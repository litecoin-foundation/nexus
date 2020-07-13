import React, {useEffect} from 'react';
import {View, Text, SafeAreaView, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {HeaderBackButton} from '@react-navigation/stack';

import TableCell from '../../components/Cells/TableCell';
import BlueButton from '../../components/Buttons/BlueButton';
import {getQuote, getSignedUrl} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';

const Confirm = (props) => {
  const {navigation} = props;
  const dispatch = useDispatch();

  const {amount, fiatAmount} = useSelector((state) => state.buy);

  const {address} = useSelector((state) => state.address);
  const {uniqueId} = useSelector((state) => state.onboarding);

  useEffect(() => {
    dispatch(getQuote());
    dispatch(getAddress());
  }, [dispatch]);

  useEffect(() => {}, []);

  const onPress = async () => {
    const {urlWithSignature} = await getSignedUrl(
      address,
      fiatAmount,
      uniqueId,
    );
    console.log(urlWithSignature);
    // test url: https://buy-staging.moonpay.io?apiKey=pk_test_RPbBRvEyfEh2h5KOKPwRhwDlwokr4Nv&walletAddress=n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF
    navigation.navigate('WebPage', {
      uri: urlWithSignature,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5A4FE7', '#2C44C8']}
        style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.headerTitle}>
            <Text style={styles.text}>YOU ARE PURCHASING</Text>
            <Text style={styles.amountText}>{amount} LTC</Text>
            <Text style={styles.text}>FROM PAYMENT PARTNER</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tableContainer}>
        <TableCell title="AVAILABLE" value="10-15 mins" />
        <TableCell title="1 LTC PRICE" value="PRICE" />
        <TableCell title="PAYMENT FEE" value="FEE" />
        <TableCell title="YOU WILL SPEND" value="TOTAL" />
      </View>

      <View style={styles.buttonContainer}>
        <BlueButton value={`BUY ${amount} LTC NOW`} onPress={onPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 200,
  },
  headerTitle: {
    alignItems: 'center',
    paddingTop: 50,
  },
  tableContainer: {
    height: 200,
  },
  buttonContainer: {
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
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    lineHeight: 22,
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.08,
  },
});

Confirm.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Buy',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderBackButton
        tintColor="white"
        labelVisible={false}
        onPress={() => navigation.goBack()}
      />
    ),
  };
};

export default Confirm;
