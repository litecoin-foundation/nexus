import React from 'react';
import {TouchableOpacity, Image, StyleSheet, Dimensions} from 'react-native';

interface Props {
  onPress: () => void;
}

const GreyRoundButton: React.FC<Props> = props => {
  const {onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={require('../../assets/images/close.png')} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get('screen').height * 0.045,
    width: Dimensions.get('screen').height * 0.045,
    borderRadius: Dimensions.get('screen').height * 0.015,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GreyRoundButton;
