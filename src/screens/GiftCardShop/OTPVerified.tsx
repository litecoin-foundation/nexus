import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, fontSize, commonStyles} from '../../components/GiftCardShop/theme';

const OTPVerified: React.FC = () => {
  return (
    <View style={[commonStyles.container, commonStyles.centered]}>
      <Text style={styles.verifiedText}>Verified</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  verifiedText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
  },
});

export default OTPVerified;