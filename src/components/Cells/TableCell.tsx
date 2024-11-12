import {StyleSheet, Text, View, Dimensions} from 'react-native';
import React from 'react';

interface CommonProps {
  title: string;
}

type ConditionalProps =
  | {
      value?: string;
      valueStyle?: object;
      children?: never;
    }
  | {
      value?: never;
      valueStyle?: never;
      children?: React.ReactNode;
    };

type Props = CommonProps & ConditionalProps;

const TableCell: React.FC<Props> = props => {
  const {title, value, valueStyle, children} = props;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children ? (
        children
      ) : (
        <Text style={[styles.text, valueStyle ? valueStyle : null]}>
          {value}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 50,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
  },
  title: {
    color: '#747e87',
    fontSize: Dimensions.get('screen').height * 0.015,
    fontWeight: '600',
  },
  text: {
    color: '#4A4A4A',
    fontSize: Dimensions.get('screen').height * 0.018,
    fontWeight: '700',
  },
});

export default TableCell;
