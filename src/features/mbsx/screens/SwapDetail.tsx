import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';
import {BUSY, acceptSwap, getSwapInfo, onMessage} from '../adapter';
import type {MbsxDrawerParamList, SwapDetails, SwapEvent} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'SwapDetail'>;

const SwapDetail: React.FC<Props> = ({route, navigation}) => {
  const {swapId} = route.params;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const [swap, setSwap] = useState<SwapDetails | null>(null);
  const [acceptError, setAcceptError] = useState('');

  const fetchSwap = useCallback(() => {
    const rv = getSwapInfo(swapId);
    if (!rv || rv.error === BUSY) {
      return;
    }
    if (rv.error) {
      navigation.navigate('SwapList');
      return;
    }
    setSwap(rv);
  }, [swapId, navigation]);

  useFocusEffect(fetchSwap);

  useEffect(() => {
    const subscription = onMessage(fetchSwap);
    return () => subscription.remove();
  }, [fetchSwap]);

  const onAccept = async () => {
    const rv = await acceptSwap(swapId);
    if (rv.error) {
      setAcceptError(rv.error);
      return;
    }
    setAcceptError('');
    fetchSwap();
  };

  if (!swap) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No swap selected</Text>
      </View>
    );
  }

  const canAccept = swap.state === 'RECEIVED';

  const LabeledRow = ({label, value}: {label: string; value: string}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LabeledRow label="ID" value={swap.id} />
        <LabeledRow label="State" value={swap.state} />
        <LabeledRow label="Created" value={swap.created_at} />
        <LabeledRow
          label="From"
          value={`${swap.amount_from} ${swap.coin_from}`}
        />
        <LabeledRow label="To" value={`${swap.amount_to} ${swap.coin_to}`} />

        <TouchableOpacity
          style={[styles.button, !canAccept && styles.buttonDisabled]}
          disabled={!canAccept}
          onPress={onAccept}>
          <Text style={styles.buttonText}>Accept Swap</Text>
        </TouchableOpacity>

        {acceptError !== '' && <Text style={styles.error}>{acceptError}</Text>}

        <Text style={styles.section}>Events</Text>
        {(swap.events ?? []).map((event: SwapEvent) => (
          <View key={event.id} style={styles.row}>
            <Text style={styles.value}>{event.time}</Text>
            <Text style={styles.value}>
              {event.event_type}
              {event.event_sub_type ? `: ${event.event_sub_type}` : ''}
            </Text>
            <Text style={styles.value}>
              {event.event_msg ?? event.event_data ?? ''}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SwapDetail;
