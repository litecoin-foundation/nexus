import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const TableCell = props => {
  const {title, value, valueStyle} = props;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.text, valueStyle ? valueStyle : null]}>{value}</Text>
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

TableCell.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default TableCell;
