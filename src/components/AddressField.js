import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

const AddressField = props => {
  const { address, onPressClose } = props;
  return (
    <View style={styles.container}>
      <View style={{ width: '95%', paddingLeft: 25 }}>
        <TextInput editable={false} value={address} />
      </View>
      <TouchableOpacity
        style={{ right: 0, position: 'absolute', paddingRight: 25 }}
        onPress={onPressClose}
      >
        <View style={styles.circle} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#F1F3F6',
    alignItems: 'center',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(151,151,151,0.2)'
  },
  circle: {
    height: 18,
    width: 18,
    borderRadius: 18 / 2,
    backgroundColor: '#979090',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

AddressField.propTypes = {
  address: PropTypes.string,
  onPressClose: PropTypes.func.isRequired
};

export default AddressField;
