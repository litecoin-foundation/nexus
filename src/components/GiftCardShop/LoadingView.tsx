import React from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {colors, spacing, commonStyles} from './theme';

export function LoadingView({message = 'Loading...'}: {message?: string}) {
  return (
    <View style={commonStyles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[commonStyles.body, {marginTop: spacing.md}]}>
        {message}
      </Text>
    </View>
  );
}
