import {StyleSheet, Text, View} from 'react-native';
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    height: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    backgroundColor: 'white',
  },
  title: {
    color: 'rgb(124,150,174)',
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TableCell;
