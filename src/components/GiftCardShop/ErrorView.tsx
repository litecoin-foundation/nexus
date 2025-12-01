import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {colors, spacing, commonStyles} from './theme';

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={commonStyles.centered}>
      <Text
        style={[
          commonStyles.body,
          {color: colors.danger, textAlign: 'center'},
        ]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[commonStyles.button, {marginTop: spacing.md}]}
          onPress={onRetry}>
          <Text style={commonStyles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
