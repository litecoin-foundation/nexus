import React from 'react';
import {
  StyleSheet,
  TouchableHighlight,
  Image,
  ImageSourcePropType,
} from 'react-native';

interface Props {
  onPress: () => void;
  imageSource: ImageSourcePropType;
}

const HeaderButton: React.FC<Props> = props => {
  const {onPress, imageSource} = props;
  return (
    <TouchableHighlight style={styles.container} onPress={onPress}>
      <Image source={imageSource} />
    </TouchableHighlight>
  );
};

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

export default HeaderButton;
