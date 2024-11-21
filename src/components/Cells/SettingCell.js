import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';

import Switch from '../Buttons/Switch';

const SettingCell = props => {
  const {
    title,
    children,
    onPress,
    forward,
    switchEnabled,
    handleSwitch,
    switchValue,
  } = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {children}
      {forward ? (
        <Image source={require('../../assets/images/forward.png')} />
      ) : null}
      {switchEnabled ? (
        <Switch initialValue={switchValue} onPress={handleSwitch} />
      ) : null}
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
    borderTopWidth: 1,
    borderColor: '#9797974d',
    backgroundColor: 'white',
  },
  title: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
});

export default SettingCell;
