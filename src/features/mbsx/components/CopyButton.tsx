import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export const CopyChip = ({
  testID,
  label,
  value,
  display,
  style,
  labelStyle,
  valueStyle,
}: {
  testID?: string;
  label: string;
  value: string;
  display?: string;
  style: object;
  labelStyle: object;
  valueStyle?: object;
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={label}
      style={style}
      onPress={() => Clipboard.setString(value)}>
      <Text style={labelStyle}>{label}</Text>
      {display ? (
        <Text style={valueStyle} numberOfLines={1}>
          {display}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const CopyButton = ({
  testID,
  label,
  value,
  style,
}: {
  testID?: string;
  label: string;
  value: string;
  style: object;
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={label}
      style={style}
      onPress={() => Clipboard.setString(value)}>
      <Image
        source={require('../../../assets/icons/copy-icon.png')}
        style={look.icon}
      />
    </TouchableOpacity>
  );
};

const look = StyleSheet.create({
  icon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
});

export default CopyButton;
