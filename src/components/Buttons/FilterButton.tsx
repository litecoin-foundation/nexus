import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  active: boolean;
  title: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
}

const FilterButton: React.FC<Props> = props => {
  const {active, title, onPress, imageSource} = props;
  return (
    <Pressable
      style={[styles.container, active ? styles.activeButton : null]}
      onPress={onPress}>
      <View style={styles.innerContainer}>
        <Image style={styles.image} source={imageSource} />
        <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: 58,
    borderRadius: 11,
    backgroundColor: undefined,
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 12,
  },
  activeButton: {
    backgroundColor: '#0A429B',
  },
  image: {
    tintColor: 'white',
    marginTop: 10,
  },
});

export default FilterButton;
