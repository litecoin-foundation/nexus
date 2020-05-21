import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const WhiteButton = (props) => {
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
    borderRadius: 25,
  },
  text: {
    color: '#183CB0',
    fontWeight: 'bold',
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

WhiteButton.propTypes = {
  value: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  small: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export default WhiteButton;
