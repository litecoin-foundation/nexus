import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';
import {BUSY, getRequestInfo, onMessage} from '../adapter';
import type {MbsxDrawerParamList, SwapRequestDetails} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestDetail'>;

const RequestDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const {requestId} = route.params;
  const [request, setRequest] = useState<SwapRequestDetails | null>(null);

  const fetchRequest = useCallback(() => {
    const rv = getRequestInfo(requestId);
    if (!rv || rv.error === BUSY) {
      return;
    }
    if (rv.error) {
      navigation.navigate('RequestList');
      return;
    }
    setRequest(rv);
  }, [requestId, navigation]);

  useFocusEffect(fetchRequest);

  useEffect(() => {
    const subscription = onMessage(fetchRequest);
    return () => subscription.remove();
  }, [fetchRequest]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No request selected</Text>
      </View>
    );
  }

  // getRequestInfo sets swapids to "error" when the lookup fails
  const swapIds = Array.isArray(request.swapids) ? request.swapids : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.row}>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{request.id.slice(0, 16)}…</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>State</Text>
          <Text style={styles.value}>{request.state}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{request.created_at}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.value}>
            {request.amount_from} {request.coin_from}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To (min)</Text>
          <Text style={styles.value}>
            {request.min_amount_to} {request.coin_to}
          </Text>
        </View>

        <Text style={styles.section}>Swaps</Text>
        {swapIds.length === 0 ? (
          <Text style={styles.empty}>No swaps</Text>
        ) : (
          swapIds.map(swapId => (
            <TouchableOpacity
              key={swapId}
              style={styles.row}
              onPress={() => navigation.navigate('SwapDetail', {swapId})}>
              <Text style={styles.value}>{swapId.slice(0, 16)}…</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default RequestDetail;
