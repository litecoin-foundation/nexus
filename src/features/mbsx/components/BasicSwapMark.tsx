import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SvgXml} from 'react-native-svg';

import {basicswapLogoXml} from '../basicswapLogo';

const BasicSwapMark = ({
  width = 108,
  align = 'center',
}: {
  width?: number;
  align?: 'center' | 'left';
}) => (
  <View style={align === 'left' ? styles.left : styles.row}>
    <SvgXml xml={basicswapLogoXml} width={width} height={(width * 32) / 121} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
});

export default BasicSwapMark;
