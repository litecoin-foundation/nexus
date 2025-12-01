import React from 'react';
import {View, Text} from 'react-native';
import {colors, commonStyles} from './theme';

export function EmptyView({message}: {message: string}) {
  return (
    <View style={commonStyles.centered}>
      <Text
        style={[
          commonStyles.body,
          {color: colors.textSecondary, textAlign: 'center'},
        ]}>
        {message}
      </Text>
    </View>
  );
}
