import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity} from 'react-native';

import {useCopied} from './useCopied';

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
  const {copied, copy} = useCopied();
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={copied ? 'Copied' : label}
      style={style}
      onPress={() => copy(value)}>
      <Text style={labelStyle}>{copied ? 'Copied' : label}</Text>
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
  const {copied, copy} = useCopied();
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={copied ? 'Copied' : label}
      style={copied ? look.copiedBtn : style}
      onPress={() => copy(value)}>
      {copied ? (
        <Text style={look.copied}>Copied</Text>
      ) : (
        <Image
          source={require('../../../assets/icons/copy-icon.png')}
          style={look.icon}
        />
      )}
    </TouchableOpacity>
  );
};

const look = StyleSheet.create({
  copiedBtn: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  copied: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#1C8C45',
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
});

export default CopyButton;
