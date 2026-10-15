import React, {memo, useCallback, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

import {useAppSelector} from '../../../store/hooks';
import {formatTimestamp} from '../format';
import {swapCards} from '../swapCards';
import {requestStateText, swapStateText, useShowUtcTimes} from '../stateText';
import type {MbsxMessage} from '../mbsxSlice';

type ParsedEvent = {
  title: string;
  time: string;
  message: string;
  raw: string;
};

const sentenceOrRaw = (sentence: string, raw: string) =>
  sentence === sentence.trim() && !sentence.includes('  ') ? sentence : raw;

const parsedEvent = (data: string, utc: boolean): ParsedEvent | null => {
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof value.event_type !== 'string') {
    return null;
  }
  const sub = value.event_sub_type;
  const subText = typeof sub === 'string' ? sub : '';
  let title = value.event_type;
  if (value.event_type === 'STATE_CHANGED' && subText) {
    title = sentenceOrRaw(swapStateText(subText, '', ''), subText);
  } else if (value.event_type === 'REQUEST_STATE_CHANGED' && subText) {
    title = sentenceOrRaw(requestStateText(subText), subText);
  } else if (subText) {
    title = `${value.event_type} · ${subText}`;
  }
  const time =
    typeof value.time === 'string'
      ? formatTimestamp(value.time, utc, true)
      : '';
  const message = typeof value.event_msg === 'string' ? value.event_msg : '';
  return {title, time, message, raw: data};
};

const Row = memo(function Row({data, utc}: {data: string; utc: boolean}) {
  const [open, setOpen] = useState(false);
  const event = parsedEvent(data, utc);
  if (!event) {
    return (
      <View style={swapCards.card}>
        <Text style={swapCards.historyTitle} selectable>
          {data}
        </Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={swapCards.card}
      onPress={() => setOpen(shown => !shown)}>
      <Text style={swapCards.historyTitle}>{event.title}</Text>
      {event.time ? (
        <Text style={swapCards.historySub}>{event.time}</Text>
      ) : null}
      {event.message ? (
        <Text style={swapCards.meta}>{event.message}</Text>
      ) : null}
      {open ? (
        <Text style={swapCards.id} selectable>
          {event.raw}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

const MessageList: React.FC<{
  style?: StyleProp<ViewStyle>;
  embedded?: boolean;
}> = ({style, embedded}) => {
  const messages = useAppSelector(state => state.mbsx.messages);
  const utc = useShowUtcTimes();

  const renderItem = useCallback(
    ({item}: {item: MbsxMessage}) => <Row data={item.data} utc={utc} />,
    [utc],
  );
  const keyExtractor = useCallback((item: MbsxMessage) => String(item.id), []);

  if (embedded) {
    return (
      <View>
        {messages.length === 0 ? (
          <View style={swapCards.card}>
            <Text style={swapCards.note}>No events yet</Text>
          </View>
        ) : (
          messages.map(item => <Row key={item.id} data={item.data} utc={utc} />)
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={style}
      contentContainerStyle={look.list}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={12}
      windowSize={5}
      removeClippedSubviews
      ListEmptyComponent={
        <View style={swapCards.card}>
          <Text style={swapCards.note}>No events yet</Text>
        </View>
      }
    />
  );
};

const look = {
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
};

export default MessageList;
