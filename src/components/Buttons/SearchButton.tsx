import {
  StyleSheet,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import React from 'react';

type Props = {
  onPress(event: GestureResponderEvent): void;
};

const SearchButton = (props: Props) => {
  const {onPress} = props;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={require('../../assets/images/search.png')} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 32,
    width: 32,
    marginRight: 22,
  },
});

export default SearchButton;
