import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Clipboard, SafeAreaView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';

import RequestModal from '../components/Modals/RequestModal';
import BlueButton from '../components/Buttons/BlueButton';
import BlueClearButton from '../components/Buttons/BlueClearButton';
import {getAddress} from '../reducers/address';
import * as bip21 from '../lib/utils/bip21';

const Receive = () => {
  const dispatch = useDispatch();
  const address = useSelector(state => state.address.address);

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, changeAmount] = useState('');
  const [uri, setURI] = useState('');

  useEffect(() => {
    dispatch(getAddress());
    setURI(address);
  }, [address, dispatch]);

  const handleCopy = async () => {
    await Clipboard.setString(address);
  };

  const handleChange = input => {
    changeAmount(input);
    updateQR();
  };

  const updateQR = () => {
    setURI(bip21.encodeBIP21(address, {amount}));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5A4FE7', '#2C44C8']}
        style={styles.headerContainer}>
        <SafeAreaView />
      </LinearGradient>
      {!uri ? (
        <Text>loading...</Text>
      ) : (
        <View style={styles.qrContainer}>
          <QRCode value={uri} color="rgba(10, 36, 79, 1)" size={350} />
        </View>
      )}
      <View style={styles.detailContainer}>
        <View style={styles.topDetailContainer}>
          <Text style={styles.titleText}>My LTC Address</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>
        <View style={styles.bottomDetailContainer}>
          <View style={styles.bottomDetailPadding}>
            <BlueButton value="Copy to Clipboard" onPress={handleCopy} />
          </View>
          <View style={styles.containerDivider}>
            <BlueClearButton
              value="Request Specific Amount"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </View>
      </View>

      <RequestModal
        isVisible={modalVisible}
        close={() => setModalVisible(false)}
        onChange={input => handleChange(input)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F6F9FC',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(151, 151, 151, 0.3)',
  },
  qrContainer: {
    paddingTop: 15,
    paddingBottom: 15,
    alignItems: 'center',
  },
  topDetailContainer: {
    paddingTop: 20,
    paddingLeft: 20,
  },
  bottomDetailContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  titleText: {
    color: '#7C96AE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressText: {
    color: '#20BB74',
    fontSize: 16,
    fontWeight: '600',
  },
  containerDivider: {
    paddingTop: 20,
    borderTopColor: 'rgba(151, 151, 151, 0.3)',
    borderTopWidth: 1,
  },
  bottomDetailPadding: {
    paddingBottom: 20,
  },
  headerContainer: {
    height: 120,
  },
});

Receive.navigationOptions = ({navigation}) => {
  return {
    headerTitle: 'Receive',
    headerTitleStyle: {
      fontWeight: 'bold',
      color: 'white',
    },
    headerTransparent: true,
    headerBackTitle: null,
  };
};

export default Receive;
