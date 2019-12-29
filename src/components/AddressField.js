import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';

const AddressField = props => {
  const {address, onPressClose} = props;
  return (
    <View style={styles.container}>
      <View style={styles.addressContainer}>
        <TextInput editable={false} value={address} style={styles.text} />
      </View>
      <TouchableOpacity style={styles.closeContainer} onPress={onPressClose}>
        <Image
          style={styles.circle}
          source={require('../assets/images/check-off.png')}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: 'rgba(216,216,216,0.2)',
    alignItems: 'center',
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#97979733',
  },
  addressContainer: {
    width: '95%',
    paddingLeft: 25,
  },
  closeContainer: {
    right: 0,
    position: 'absolute',
    paddingRight: 25,
  },
  circle: {
    height: 18,
    width: 18,
  },
  text: {
    color: '#20BB74',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.54,
  },
});

AddressField.propTypes = {
  address: PropTypes.string,
  onPressClose: PropTypes.func.isRequired,
};

export default AddressField;
