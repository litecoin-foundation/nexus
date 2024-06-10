import React from 'react';
import {
  StyleSheet,
  TouchableHighlight,
  Image,
  ImageSourcePropType,
  Text,
  Platform,
  View,
} from 'react-native';

interface Props {
  onPress: () => void;
  imageSource: ImageSourcePropType;
  title?: string;
}

const HeaderButton: React.FC<Props> = props => {
  const {onPress, imageSource, title} = props;
  return (
    <TouchableHighlight style={styles.container} onPress={onPress}>
      <View style={styles.subcontainer}>
        <Image source={imageSource} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9,
    backgroundColor: 'rgba(216,216,216,0.2)',
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  subcontainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
  },
  title: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 12,
  },
});

export default HeaderButton;
