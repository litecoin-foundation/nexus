import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {Pagination} from 'react-native-snap-carousel';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

import AuthPad from '../Numpad/AuthPad';
import GreyRoundButton from '../Buttons/GreyRoundButton';

const PinModal = props => {
  const {isVisible, close, handleValidationFailure, handleValidationSuccess} =
    props;
  const pin = useSelector(state => state.authpad.pin);

  return (
    <Modal
      isVisible={isVisible}
      swipeDirection="down"
      backdropColor="rgb(19,58,138)"
      backdropOpacity={0.6}
      style={styles.noMargin}>
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalHeaderTitle}>Enter Pincode</Text>
            <GreyRoundButton onPress={() => close()} />
          </View>
          <LinearGradient
            style={styles.contentContainer}
            colors={['#F2F8FD', '#d2e1ef00']}>
            <Pagination
              dotStyle={styles.dotStyle}
              inactiveDotColor="#2C72FF"
              dotColor="#2C72FF"
              dotsLength={6}
              activeDotIndex={pin.length - 1}
            />
            <AuthPad
              handleValidationFailure={handleValidationFailure}
              handleValidationSuccess={handleValidationSuccess}
              handleBiometricPress={handleValidationSuccess}
            />
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  modal: {
    backgroundColor: 'white',
    height: 600,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 25,
    paddingBottom: 25,
  },
  modalHeaderTitle: {
    color: '#4E6070',
    fontSize: 26,
    fontWeight: 'bold',
    height: 31,
  },
  noMargin: {
    margin: 0,
  },
  dotStyle: {
    width: 9,
    height: 9,
    borderRadius: 9 / 2,
    marginHorizontal: 5,
  },
  contentContainer: {
    flex: 1,
  },
});

export default PinModal;
