import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {StyleProp, TextStyle} from 'react-native';
import {SvgXml} from 'react-native-svg';

const INK = '#747E87';

const CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;

const Clock = () => (
  <View accessibilityLabel="Clock">
    <SvgXml xml={CLOCK} width={16} height={16} />
  </View>
);

export const TimeLine = ({
  text,
  textStyle,
  align = 'start',
}: {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  align?: 'start' | 'end';
}) => (
  <View style={[styles.line, align === 'end' ? styles.lineEnd : null]}>
    <Clock />
    <Text
      style={[styles.lineText, align === 'end' ? styles.lineTextEnd : null, textStyle]}
      numberOfLines={1}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lineEnd: {
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  lineText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Satoshi Variable',
    color: INK,
    fontSize: 14,
  },
  lineTextEnd: {
    flex: 0,
  },
});
