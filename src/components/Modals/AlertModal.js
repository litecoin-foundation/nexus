import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import BlueButton from '../Buttons/BlueButton';

const AlertModal = props => {
  const {isVisible, close, onPress} = props;

  return (
    <Modal
      isVisible={isVisible}
      swipeDirection="down"
      onSwipeComplete={() => close()}
      backdropColor="rgb(19,58,138)"
      backdropOpacity={0.6}
      style={styles.noMargin}>
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalHeaderTitle}>Delete Alert</Text>
            <GreyRoundButton onPress={() => close()} />
          </View>

          <View style={styles.buttonContainer}>
            <BlueButton
              value="Delete Alert"
              onPress={() => {
                onPress();
                close();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  modal: {
    flex: 1,
    backgroundColor: 'white',
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
  buttonContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AlertModal;
