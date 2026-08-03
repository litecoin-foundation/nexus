import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {listRequests, onMessage} from '../adapter';
import type {MbsxDrawerParamList, SwapRequestSummary} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestList'>;

const RequestList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const running = useAppSelector(state => state.mbsx.running);
  const [requests, setRequests] = useState<SwapRequestSummary[]>([]);

  const fetchRequests = useCallback(() => {
    const rows = listRequests();
    if (rows) {
      setRequests(rows);
    }
  }, []);

  useFocusEffect(fetchRequests);

  useEffect(() => {
    fetchRequests();
    const subscription = onMessage(fetchRequests);
    return () => subscription.remove();
  }, [fetchRequests, running]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {requests.length === 0 ? (
          running ? (
            <Text style={styles.empty}>No requests</Text>
          ) : null
        ) : (
          requests.map(request => (
            <TouchableOpacity
              key={request.id}
              style={styles.row}
              onPress={() =>
                navigation.navigate('RequestDetail', {requestId: request.id})
              }>
              <Text style={styles.coins}>
                {request.coin_from} → {request.coin_to}
              </Text>
              <Text style={styles.value}>{request.state}</Text>
              <Text style={styles.value}>{request.id.slice(0, 8)}…</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default RequestList;
