import React, {memo, useCallback, useContext} from 'react';
import {FlatList, Text, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import type {MbsxMessage} from '../mbsxSlice';

// A row's text never changes once appended, so memoising means appending a
// message leaves the rows already on screen untouched.
const Row = memo(function Row({data, style}: {data: string; style: any}) {
  return (
    <View style={style}>
      <Text numberOfLines={3}>{data}</Text>
    </View>
  );
});

const MessageList: React.FC<{style?: StyleProp<ViewStyle>}> = ({style}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const messages = useAppSelector(state => state.mbsx.messages);

  // Both must keep their identity across renders or FlatList discards its cells.
  const renderItem = useCallback(
    ({item}: {item: MbsxMessage}) => (
      <Row data={item.data} style={styles.messageRow} />
    ),
    [styles.messageRow],
  );
  const keyExtractor = useCallback((item: MbsxMessage) => String(item.id), []);

  return (
    <FlatList
      style={style}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={12}
      windowSize={5}
      removeClippedSubviews
    />
  );
};

export default MessageList;
