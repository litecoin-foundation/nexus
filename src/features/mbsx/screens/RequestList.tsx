import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {triggerLightFeedback} from '../../../utils/haptic';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {
  describeRemoval,
  isEndedRequestState,
  listRequests,
  onMessage,
  removeRequests,
  requestExpired,
  sortNewestFirst,
} from '../adapter';
import {formatExpiry} from '../format';
import RemoveButton from '../components/RemoveButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import {requestStateText, useShowRawStates} from '../stateText';
import type {MbsxDrawerParamList, SwapRequestSummary} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestList'>;

const RequestList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const running = useAppSelector(state => state.mbsx.running);
  const showRaw = useShowRawStates();
  const [requests, setRequests] = useState<SwapRequestSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'ended'>('all');

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

  const sorted = sortNewestFirst(requests);
  const shown = sorted.filter(request => {
    if (filter === 'open') {
      return !isEndedRequestState(request.state);
    }
    if (filter === 'ended') {
      return isEndedRequestState(request.state);
    }
    return true;
  });
  const chips: {id: typeof filter; label: string}[] = [
    {id: 'all', label: 'All'},
    {id: 'open', label: 'Open'},
    {id: 'ended', label: 'Ended'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerAction}>
        <RemoveButton
          testID="mbsx-remove-expired"
          label="Remove expired"
          confirm="Permanently delete every request that drew no offer it can still accept?"
          disabled={!running}
          onConfirm={async () => {
            const rv = await removeRequests(requestExpired);
            fetchRequests();
            return describeRemoval(rv, 'Nothing expired to remove');
          }}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRequests();
              setRefreshing(false);
            }}
          />
        }>
        <View style={styles.chipRow}>
          {chips.map(chip => {
            const on = filter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                testID={`mbsx-request-filter-${chip.id}`}
                style={[styles.chip, on ? styles.chipSelected : null]}
                onPress={() => setFilter(chip.id)}>
                <Text style={[styles.chipText, on ? styles.chipTextSelected : null]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {shown.length === 0 ? (
          running ? (
            <View style={swapCards.card}>
              <Text style={swapCards.note}>
                {filter === 'all' ? 'No requests yet' : 'Nothing here'}
              </Text>
              {filter === 'all' ? (
                <TouchableOpacity
                  testID="mbsx-empty-new-request"
                  onPress={() => {
                    triggerLightFeedback();
                    navigation.navigate('CreateSwap');
                  }}>
                  <Text style={swapCards.link}>New Swap</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null
        ) : (
          shown.map(request => (
                  <TouchableOpacity
                    key={request.id}
                    style={swapCards.card}
                    onPress={() =>
                      navigation.navigate('RequestDetail', {
                        requestId: request.id,
                      })
                    }>
                    <View style={swapCards.pair}>
                      {COIN_ICONS[request.coin_from] ? (
                        <Image
                          source={COIN_ICONS[request.coin_from]}
                          style={swapCards.coinLogo}
                        />
                      ) : null}
                      <Text style={swapCards.pairText}>
                        {`${request.coin_from} → ${request.coin_to}`}
                      </Text>
                      {COIN_ICONS[request.coin_to] ? (
                        <Image
                          source={COIN_ICONS[request.coin_to]}
                          style={swapCards.coinLogoEnd}
                        />
                      ) : null}
                    </View>
                    <Text style={swapCards.status}>
                      {requestStateText(request.state)}
                    </Text>
                    {showRaw ? (
                      <Text style={swapCards.id}>{request.state}</Text>
                    ) : null}
                    <Text style={swapCards.meta}>
                      {`${request.amount_from} ${request.coin_from} · ${formatExpiry(
                        request.created_at,
                      )}`}
                    </Text>
                    <Text style={swapCards.id}>{request.id}</Text>
                  </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default RequestList;
