import React, {useEffect} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {HeaderBackButton} from '@react-navigation/elements';

import TableCell from '../../components/Cells/TableCell';
import BlueButton from '../../components/Buttons/BlueButton';
import {getSignedUrl} from '../../reducers/buy';
import {getAddress} from '../../reducers/address';

const Confirm = props => {
  const {navigation} = props;
  const dispatch = useDispatch();

  const {quote, fiatAmount} = useSelector(state => state.buy);
  const {currencySymbol} = useSelector(state => state.settings);
  const {
    quoteCurrencyAmount,
    quoteCurrencyPrice,
    feeAmount,
    extraFeeAmount,
    networkFeeAmount,
    totalAmount,
  } = quote;

  const {address} = useSelector(state => state.address);
  const {uniqueId} = useSelector(state => state.onboarding);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const onPress = async () => {
    const {urlWithSignature} = await getSignedUrl(
      address,
      fiatAmount,
      uniqueId,
    );
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
            <Text style={styles.amountText}>{quoteCurrencyAmount} LTC</Text>
            <Image
              style={styles.image}
              source={require('../../assets/images/down-arrow.png')}
            />
            <Text style={styles.text}>FROM PAYMENT PARTNER</Text>

            <View style={styles.partnerContainer}>
              <Image
                source={require('../../assets/images/moonpay.png')}
                style={styles.partnerLogo}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.tableContainer}>
        <TableCell
          title="AVAILABLE"
          value="5-10 mins"
          valueStyle={styles.availableText}
        />
        <TableCell
          title="1 LTC PRICE"
          value={`${currencySymbol}${parseFloat(quoteCurrencyPrice).toFixed(
            2,
          )}`}
          valueStyle={styles.ltcText}
        />
        <TableCell
          title="PAYMENT FEE"
          value={`${currencySymbol}${parseFloat(
            feeAmount + extraFeeAmount + networkFeeAmount,
          ).toFixed(2)}`}
          valueStyle={styles.feeText}
        />
        <TableCell
          title="YOU WILL SPEND"
          value={`${currencySymbol}${totalAmount}`}
          valueStyle={styles.totalText}
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BlueButton value="BUY NOW" onPress={onPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 330,
  },
  headerTitle: {
    alignItems: 'center',
    paddingTop: 50,
  },
  tableContainer: {
    backgroundColor: 'rgb(238,244,249)',
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
  headerLeftMargin: {
    marginLeft: 22,
  },
  image: {
    height: 14,
    width: 14,
    marginTop: 18,
    marginBottom: 14,
  },
  availableText: {
    color: '#4A4A4A',
    fontSize: 16,
  },
  ltcText: {
    color: '#2C72FF',
    fontSize: 16,
  },
  feeText: {
    color: '#7C96AE',
    fontSize: 16,
  },
  totalText: {
    color: '#20BB74',
    fontSize: 16,
  },
  partnerContainer: {
    width: 335,
    height: 74,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: 'rgb(38,44,85)',
    shadowOpacity: 0.86,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  partnerLogo: {
    height: 40,
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

export default Confirm;
