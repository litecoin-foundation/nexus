import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface Props {
  title: string;
  children: React.ReactElement;
}

const VerticalTableCell: React.FC<Props> = props => {
  const {title, children} = props;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingLeft: 22,
    paddingRight: 25,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(151,151,151,0.3)',
    backgroundColor: 'white',
  },
  title: {
    color: '#747e87',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    paddingBottom: 2,
  },
});

export default VerticalTableCell;
