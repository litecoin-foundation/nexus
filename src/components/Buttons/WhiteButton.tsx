import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';

interface Props {
  value: string;
  onPress(): void;
  small: boolean;
  disabled?: boolean;
  customStyles?: {};
  customFontStyles?: {};
  active: boolean;
}

const WhiteButton: React.FC<Props> = props => {
  const {
    value,
    onPress,
    small,
    disabled,
    customStyles,
    customFontStyles,
    active,
  } = props;

  return (
    <TouchableOpacity
      disabled={disabled ? disabled : null}
      style={[
        styles.container,
        small ? styles.small : styles.big,
        disabled ? styles.disabled : null,
        customStyles,
        active ? styles.active : null,
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles.text,
          customFontStyles,
          active ? null : styles.inactiveText,
          small ? styles.smallText : null,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    height: 29,
    borderRadius: 29 / 2,
    paddingLeft: 15,
    paddingRight: 15,
  },
  big: {
    height: 50,
    width: 335,
    borderRadius: 9,
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 17,
  },
  disabled: {
    opacity: 0.5,
  },
  active: {
    backgroundColor: 'white',
  },
  inactiveText: {
    color: 'white',
  },
  smallText: {
    fontSize: 11,
  },
});

export default WhiteButton;
