import React, {useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {colors, getSpacing, getCommonStyles} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <View style={getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).centered}>
      <Text
        style={[
          getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).body,
          {color: colors.danger, textAlign: 'center'},
        ]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[
            getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).button,
            {marginTop: getSpacing(SCREEN_HEIGHT).md},
          ]}
          onPress={onRetry}>
          <Text style={getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
