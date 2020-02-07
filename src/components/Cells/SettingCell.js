import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

const SettingCell = props => {
  const {title, children, onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </TouchableOpacity>
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
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#9797974d',
    backgroundColor: 'white',
  },
  title: {
    color: '#7c96ae',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingCell;
