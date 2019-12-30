import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Clipboard,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import QRCode from 'react-native-qrcode-svg';
import {useDispatch, useSelector} from 'react-redux';

import Header from '../Header';
import {clearInvoice} from '../../reducers/invoice';

const InvoiceModal = props => {
  const {isVisible, close} = props;
  const dispatch = useDispatch();
  const invoice = useSelector(state => state.invoice.paymentRequest);
  const description = useSelector(state => state.invoice.description);
  const value = useSelector(state => state.invoice.value);

  useEffect(() => {
    return () => {
      dispatch(clearInvoice());
    };
  }, [dispatch]);

  const handleCopy = async () => {
    alert('copied');
    await Clipboard.setString(invoice);
  };

  return (
    <Modal isVisible={isVisible} swipeDirection="down" style={styles.noMargin}>
      <View style={styles.container}>
        <Header>
          <TouchableOpacity style={styles.closeButton} onPress={() => close()}>
            <Image source={require('../../assets/images/close-white.png')} />
          </TouchableOpacity>
        </Header>

        {!invoice ? (
          <Text>loading...</Text>
        ) : (
          <View style={styles.qrContainer}>
            <QRCode value={invoice} color="rgba(10, 36, 79, 1)" size={350} />
          </View>
        )}
        <View style={styles.detailContainer}>
          <Text style={styles.paymentText}>Please pay: {value}</Text>
          <Text style={styles.paymentText}>{description}</Text>
          <TouchableOpacity onPress={() => handleCopy()}>
            <Text>{invoice}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    backgroundColor: 'white',
  },
  noMargin: {
    margin: 0,
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F6F9FC',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(151, 151, 151, 0.3)',
  },
  paymentText: {
    textAlign: 'center',
    color: 'rgba(10, 36, 79, 1)',
  },
  closeButton: {
    height: '100%',
    justifyContent: 'center',
    left: 15,
  },
});

export default InvoiceModal;
