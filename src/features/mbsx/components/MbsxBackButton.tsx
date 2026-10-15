import React from 'react';
import {View, StyleSheet} from 'react-native';

import HeaderButton from '../../../components/Buttons/HeaderButton';

interface Props {
  onPress: () => void;
}

/** Replaces the drawer's own toggle, which is all headerLeft otherwise holds. */
const MbsxBackButton: React.FC<Props> = ({onPress}) => (
  <View style={styles.container}>
    <HeaderButton
      testID="mbsx-back"
      onPress={onPress}
      imageSource={require('../../../assets/images/back-icon.png')}
      leftPadding
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MbsxBackButton;
