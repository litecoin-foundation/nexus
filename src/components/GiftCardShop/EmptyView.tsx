import React, {useContext} from 'react';
import {View, Text} from 'react-native';
import {colors, getCommonStyles} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

export function EmptyView({message}: {message: string}) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  return (
    <View style={getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).centered}>
      <Text
        style={[
          getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT).body,
          {color: colors.textSecondary, textAlign: 'center'},
        ]}>
        {message}
      </Text>
    </View>
  );
}
