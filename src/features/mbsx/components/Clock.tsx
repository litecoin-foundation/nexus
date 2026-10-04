import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {StyleProp, TextStyle} from 'react-native';

const INK = '#747E87';

const Clock = () => (
  <View style={styles.face} accessibilityLabel="Clock">
    <View style={[styles.handWrap, {transform: [{rotate: '-55deg'}]}]}>
      <View style={styles.hourHand} />
    </View>
    <View style={[styles.handWrap, {transform: [{rotate: '50deg'}]}]}>
      <View style={styles.minuteHand} />
    </View>
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
  face: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.25,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handWrap: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
  },
  hourHand: {
    width: 1.25,
    height: 3.5,
    marginTop: 4,
    borderRadius: 1,
    backgroundColor: INK,
  },
  minuteHand: {
    width: 1.25,
    height: 5,
    marginTop: 2.5,
    borderRadius: 1,
    backgroundColor: INK,
  },
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
