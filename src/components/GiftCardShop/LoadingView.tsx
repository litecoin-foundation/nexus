import React, {useContext} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {colors, getSpacing, getCommonStyles} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

export function LoadingView({message = 'Loading...'}: {message?: string}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <View style={getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text
        style={[
          getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).body,
          {marginTop: getSpacing(SCREEN_WIDTH, SCREEN_HEIGHT).md},
        ]}>
        {message}
      </Text>
    </View>
  );
}
