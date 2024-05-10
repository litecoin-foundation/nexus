import {StyleSheet, TouchableHighlight, Image} from 'react-native';
import React from 'react';

interface Props {
  onPress: () => void;
}

const SettingsCogsButton: React.FC<Props> = props => {
  const {onPress} = props;
  return (
    <TouchableHighlight style={styles.container} onPress={onPress}>
      <Image source={require('../../assets/icons/settings-cog.png')} />
    </TouchableHighlight>
  );
};

export default SettingsCogsButton;

const styles = StyleSheet.create({
  container: {
    borderRadius: 9,
    backgroundColor: 'rgba(216,216,216,0.2)',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
});
