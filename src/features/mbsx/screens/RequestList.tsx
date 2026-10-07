import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {CopyChip} from '../components/CopyButton';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {triggerLightFeedback} from '../../../utils/haptic';
import {useAppSelector} from '../../../store/hooks';
import {getMbsxStyles} from '../theme';
import {
  ENDED_DEPOSIT_STATES,
  describeRemoval,
  isEndedRequestState,
  listDeposits,
  listRequests,
  onMessage,
  removeRequests,
  requestExpired,
  sortNewestFirst,
} from '../adapter';
import {depositTimeLeft, formatExpiry, shortAddress} from '../format';
import RemoveButton from '../components/RemoveButton';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import {COIN_ICONS, swapCards} from '../swapCards';
import {
  depositStateText,
  requestStateText,
  useShowRawStates,
} from '../stateText';
import type {
  Deposit,
  MbsxDrawerParamList,
  SwapRequestSummary,
} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestList'>;

const Pair = ({from, to}: {from: string; to: string}) => (
  <View style={swapCards.pair}>
    {COIN_ICONS[from] ? (
      <Image source={COIN_ICONS[from]} style={swapCards.coinLogo} />
    ) : null}
    <Text style={swapCards.pairText}>{`${from} → ${to}`}</Text>
    {COIN_ICONS[to] ? (
      <Image source={COIN_ICONS[to]} style={swapCards.coinLogoEnd} />
    ) : null}
  </View>
);

const RequestList: React.FC<Props> = ({navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();

  const running = useAppSelector(state => state.mbsx.running);
  const showRaw = useShowRawStates();
  const [requests, setRequests] = useState<SwapRequestSummary[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'ended'>('all');

  const fetchRequests = useCallback(() => {
    const rows = listRequests();
    if (rows) {
      setRequests(rows);
    }
    const payIns = listDeposits();
    if (payIns) {
      setDeposits(payIns);
    }
  }, []);

  // Pay-ins move on the deposit watch's polls, which send no message.
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      const timer = setInterval(fetchRequests, 3000);
      return () => clearInterval(timer);
    }, [fetchRequests]),
  );

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
  const payIns =
    filter === 'ended'
      ? []
      : deposits.filter(deposit => !ENDED_DEPOSIT_STATES.has(deposit.state));
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
          label="Remove Expired"
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
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}
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
        {payIns.map(deposit => (
          <TouchableOpacity
            key={deposit.deposit_id}
            testID={`mbsx-payin-${deposit.deposit_id}`}
            style={swapCards.card}
            onPress={() =>
              navigation.navigate('PayInDetail', {
                depositId: deposit.deposit_id,
              })
            }>
            <Pair from={deposit.coin} to={deposit.coin_to} />
            <Text style={swapCards.status}>
              {depositStateText(deposit.state, deposit.coin)}
            </Text>
            {showRaw ? (
              <Text style={swapCards.id}>{deposit.state}</Text>
            ) : null}
            <TimeLine
              text={
                Number(deposit.remaining) > 0
                  ? `${deposit.remaining} ${deposit.coin} still to pay · ${depositTimeLeft(deposit.expire_at)}`
                  : `${deposit.received} ${deposit.coin} received · ${depositTimeLeft(deposit.expire_at)}`
              }
            />
          </TouchableOpacity>
        ))}
        {shown.length === 0 && payIns.length === 0 ? (
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
                    testID={`mbsx-request-${request.id}`}
                    style={swapCards.card}
                    onPress={() =>
                      navigation.navigate('RequestDetail', {
                        requestId: request.id,
                      })
                    }>
                    <Pair from={request.coin_from} to={request.coin_to} />
                    <Text style={swapCards.status}>
                      {requestStateText(request.state)}
                    </Text>
                    {showRaw ? (
                      <Text style={swapCards.id}>{request.state}</Text>
                    ) : null}
                    <TimeLine
                      text={
                        isEndedRequestState(request.state)
                          ? `${request.amount_from} ${request.coin_from} · ${formatExpiry(request.created_at)}`
                          : `${request.amount_from} ${request.coin_from} · expires ${formatExpiry(request.expire_at)}`
                      }
                    />
                    <CopyChip
                      testID={`mbsx-request-copy-${request.id}`}
                      label="Request"
                      value={request.id}
                      display={shortAddress(request.id)}
                      style={look.idChip}
                      labelStyle={look.idLabel}
                      valueStyle={look.idValue}
                    />
                  </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const look = StyleSheet.create({
  idChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  idLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
    marginRight: 8,
  },
  idValue: {
    fontFamily: 'Satoshi Variable',
    color: '#484859',
    fontSize: 13,
  },
});

export default RequestList;
