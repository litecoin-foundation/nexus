import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const BlueButton: React.FC<Props> = props => {
  const {value, onPress, disabled} = props;
  return (
    <TouchableOpacity
      style={[styles.container, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#2C72FF',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});

export default BlueButton;
