import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
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

const BADGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 2 20 28" width="16" height="16"><path fill="#ffffff" d="M5.4,10.6C5.4,9.1,6.6,8,8,8h11.8l-2,2c-0.3,0.3-0.3,0.9,0,1.2s0.9,0.3,1.2,0l3.4-3.4c0.2-0.1,0.3-0.4,0.3-0.7c0-0.2-0.1-0.5-0.3-0.6L19,3c-0.3-0.3-0.9-0.3-1.2,0c-0.3,0.3-0.3,0.9,0,1.2l2,2H8c-2.4,0-4.3,2-4.3,4.4v8.1c0,0.5,0.4,0.9,0.9,0.9s0.9-0.4,0.9-0.9L5.4,10.6L5.4,10.6z"/><path fill="#ffffff" d="M18.1,24H6.3l2-2c0.3-0.3,0.3-0.9,0-1.2c-0.3-0.3-0.9-0.3-1.2,0l-3.4,3.4c-0.2,0.1-0.3,0.4-0.3,0.7c0,0.2,0.1,0.5,0.3,0.6L7.1,29c0.3,0.3,0.9,0.3,1.2,0s0.3-0.9,0-1.2l-2-2h11.8c2.4,0,4.3-2,4.3-4.4v-8.1c0-0.5-0.4-0.9-0.9-0.9s-0.9,0.4-0.9,0.9v8.1C20.7,22.9,19.5,24,18.1,24z"/></svg>`;

export const BasicSwapBadge = () => (
  <View style={styles.badge}>
    <SvgXml xml={BADGE} width={14} height={14} />
  </View>
);

const ARROWS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 2 20 28" width="16" height="16"><path fill="#0073FF" d="M5.4,10.6C5.4,9.1,6.6,8,8,8h11.8l-2,2c-0.3,0.3-0.3,0.9,0,1.2s0.9,0.3,1.2,0l3.4-3.4c0.2-0.1,0.3-0.4,0.3-0.7c0-0.2-0.1-0.5-0.3-0.6L19,3c-0.3-0.3-0.9-0.3-1.2,0c-0.3,0.3-0.3,0.9,0,1.2l2,2H8c-2.4,0-4.3,2-4.3,4.4v8.1c0,0.5,0.4,0.9,0.9,0.9s0.9-0.4,0.9-0.9L5.4,10.6L5.4,10.6z"/><path fill="#0073FF" d="M18.1,24H6.3l2-2c0.3-0.3,0.3-0.9,0-1.2c-0.3-0.3-0.9-0.3-1.2,0l-3.4,3.4c-0.2,0.1-0.3,0.4-0.3,0.7c0,0.2,0.1,0.5,0.3,0.6L7.1,29c0.3,0.3,0.9,0.3,1.2,0s0.3-0.9,0-1.2l-2-2h11.8c2.4,0,4.3-2,4.3-4.4v-8.1c0-0.5-0.4-0.9-0.9-0.9s-0.9,0.4-0.9,0.9v8.1C20.7,22.9,19.5,24,18.1,24z"/></svg>`;

export const BasicSwapWord = () => (
  <View style={styles.word}>
    <SvgXml xml={ARROWS} width={13} height={15} />
    <Text style={styles.wordText}>basicswap</Text>
  </View>
);

export const BasicSwapArrows = ({size = 16}: {size?: number}) => (
  <SvgXml xml={ARROWS} width={size} height={size} />
);

const styles = StyleSheet.create({
  badge: {
    width: 22,
    height: 22,
    marginLeft: 8,
    borderRadius: 5,
    backgroundColor: '#1162E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordText: {
    marginLeft: 5,
    fontFamily: 'Satoshi Variable',
    fontWeight: '800',
    color: '#212121',
    fontSize: 13,
  },
});

export default BasicSwapMark;
