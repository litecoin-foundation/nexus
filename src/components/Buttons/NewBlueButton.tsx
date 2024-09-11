import React from 'react';
import {StyleSheet, Text, Platform, TouchableOpacity} from 'react-native';

interface Props {
  title: string;
  active: boolean;
  onPress: () => void;
}

const NewBlueButton: React.FC<Props> = props => {
  const {title, active, onPress} = props;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, active ? styles.active : null]}>
      <Text style={[styles.text, active ? styles.activeText : null]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    minWidth: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: 'rgba(216,210,210,75)',
  },
  active: {
    backgroundColor: '#2C72FF',
    borderWidth: 0,
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '500',
    color: '#2E2E2E',
    fontSize: 16,
  },
  activeText: {
    color: '#FFFFFF',
  },
});

export default NewBlueButton;
