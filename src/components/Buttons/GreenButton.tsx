import React from 'react';
import {Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';

interface Props {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const GreenButton: React.FC<Props> = props => {
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
    backgroundColor: '#20BB74',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});

export default GreenButton;
