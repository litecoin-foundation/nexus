import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableHighlight,
  View,
  Platform,
} from 'react-native';

interface Props {
  imageSource: ImageSourcePropType;
}

const NewButton: React.FC<Props> = props => {
  const {imageSource} = props;
  return (
    <TouchableHighlight>
      <View style={styles.container}>
        <Image source={imageSource} />
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216, 210, 210, 0.75)',
    backgroundColor: '#fefefe',
    width: 60,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default NewButton;
