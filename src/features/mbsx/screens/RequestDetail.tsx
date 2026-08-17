import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {getMbsxStyles} from '../theme';
import {
  BUSY,
  acceptSwap,
  getRequestInfo,
  getSwapInfo,
  isTerminalState,
  onMessage,
  removeRequest,
} from '../adapter';
import RemoveButton from '../components/RemoveButton';
import type {
  MbsxDrawerParamList,
  SwapDetails,
  SwapRequestDetails,
} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestDetail'>;

// Everything an offer can be while it is still only an offer. Anything else and
// the swap is under way, so the request page is no longer the thing to look at.
const PRE_ACCEPT = new Set([
  'SENT',
  'RECEIVING',
  'RECEIVED',
  'RECEIVING_ACC',
  'EXPIRED',
  'REJECTED',
]);

const RequestDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);

  const {requestId} = route.params;
  const [request, setRequest] = useState<SwapRequestDetails | null>(null);
  const [swaps, setSwaps] = useState<SwapDetails[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [accepting, setAccepting] = useState(false);

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

  // Keyed on the ids rather than refetched per notification: one getSwapInfo
  // per swap on every main loop pass would be a lot of db locks for a screen.
  const swapIdKey = Array.isArray(request?.swapids)
    ? request.swapids.join(',')
    : '';
  useEffect(() => {
    const ids = swapIdKey ? swapIdKey.split(',') : [];
    const load = () =>
      setSwaps(
        ids
          .map(id => getSwapInfo(id))
          .filter((swap): swap is SwapDetails => swap !== null && !swap.error),
      );
    load();
    if (ids.length === 0) {
      return;
    }
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [swapIdKey]);

  const underway = swaps.find(
    swap => !PRE_ACCEPT.has(swap.state) && !isTerminalState(swap.state),
  );
  const navigatedFor = useRef<string | null>(null);
  useEffect(() => {
    if (swaps.length === 0) {
      return;
    }
    // Whatever was already under way when the screen opened is history: an old
    // request would otherwise bounce straight to its swap and never be readable.
    if (navigatedFor.current === null) {
      navigatedFor.current = underway?.id ?? '';
      return;
    }
    if (underway && navigatedFor.current !== underway.id) {
      navigatedFor.current = underway.id;
      navigation.navigate('SwapDetail', {swapId: underway.id});
    }
  }, [swaps, underway, navigation]);

  // fast path offer
  const acceptable = (swap: SwapDetails) =>
    swap.state === 'RECEIVED' && Date.parse(`${swap.expire_at}Z`) > Date.now();
  const offers = [...swaps].sort((a, b) => {
    if (acceptable(a) !== acceptable(b)) {
      return acceptable(a) ? -1 : 1;
    }
    return Number(b.initiating) - Number(a.initiating);
  });
  const best = offers.length > 0 && acceptable(offers[0]) ? offers[0] : null;
  // Only the fast path offer is worth collapsing to
  const collapsed = !showAll && best !== null && best.initiating;
  const shown = collapsed ? [best] : offers;
  // Only the collapsed fast path accepts from here; with several offers on
  // screen the row opens the swap and it is accepted there.
  const selectedSwap = collapsed ? best : null;

  const onAccept = async () => {
    if (!selectedSwap) {
      return;
    }
    setAccepting(true);
    setAcceptError('');
    try {
      const rv = await acceptSwap(selectedSwap.id);
      if (rv.error) {
        setAcceptError(rv.error);
        return;
      }
      navigation.navigate('SwapDetail', {swapId: selectedSwap.id});
    } catch (e) {
      setAcceptError((e as Error).message);
    } finally {
      setAccepting(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No request selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.stackedRow}>
          <Text style={styles.label}>ID</Text>
          <Text testID="mbsx-request-id" style={styles.rowMessage} selectable>
            {request.id}
          </Text>
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

        <Text style={styles.section}>Swap fees</Text>
        {(request.fees ?? []).length === 0 ? (
          <Text style={styles.empty}>No fees configured</Text>
        ) : (
          <>
            {request.fees?.map(fee => (
              <View key={fee.desc} style={styles.row}>
                <Text style={styles.label}>
                  {`${fee.desc} (${Number(fee.bps) / 100}%)`}
                </Text>
                <Text style={styles.value}>
                  {fee.amount} {request.fees_coin}
                </Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>
                {request.fees_total} {request.fees_coin}
              </Text>
            </View>
            <Text style={styles.empty}>
              {swaps.length === 0
                ? `On the ${request.fees_coin} chain if the offer is pushed. A bridged offer moves them to the chain it makes us follow.`
                : 'Chain fees per offer below.'}
            </Text>
          </>
        )}

        <Text style={styles.section}>Offers</Text>
        {offers.length === 0 ? (
          <Text style={styles.empty}>Waiting for an offer</Text>
        ) : (
          <>
            {shown.map(swap => {
              // A bridged swap reports chain a / chain b, which is the reverse
              // of the request's own from/to.
              const sendCoin = swap.initiating ? swap.coin_from : swap.coin_to;
              const sendAmount = swap.initiating
                ? swap.amount_from
                : swap.amount_to;
              const recvCoin = swap.initiating ? swap.coin_to : swap.coin_from;
              const recvAmount = swap.initiating
                ? swap.amount_to
                : swap.amount_from;
              return (
                <TouchableOpacity
                  key={swap.id}
                  testID={`mbsx-offer-${swap.id}`}
                  style={styles.stackedRow}
                  onPress={() =>
                    navigation.navigate('SwapDetail', {swapId: swap.id})
                  }>
                  <Text style={styles.rowPrimary}>
                    {`${swap.initiating ? 'Pushed' : 'Bridged'} — send ${sendAmount} ${sendCoin}, receive ${recvAmount} ${recvCoin}`}
                  </Text>
                  <Text style={styles.rowMessage}>
                    {acceptable(swap)
                      ? `Expires ${swap.expire_at}`
                      : `${swap.state}, expired ${swap.expire_at}`}
                  </Text>
                  {/* Named per chain: two bare rates read as one number over
                      another, with nothing saying which coin either is on. */}
                  <Text style={styles.rowMessage}>
                    {`Chain fee ${swap.coin_from} ~${swap.chain_fee_from ?? '?'} (${swap.fee_rate_from} sat/kvB)`}
                  </Text>
                  <Text style={styles.rowMessage}>
                    {`Chain fee ${swap.coin_to} ~${swap.chain_fee_to ?? '?'} (${swap.fee_rate_to} sat/kvB)`}
                  </Text>
                  {swap.fees_coin ? (
                    <Text style={styles.rowMessage}>
                      {`Swap fees ${swap.fees_total} ${swap.fees_coin}`}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {collapsed && offers.length > 1 ? (
              <TouchableOpacity
                testID="mbsx-more-offers"
                onPress={() => setShowAll(true)}>
                <Text style={styles.link}>
                  {`Show ${offers.length - 1} more offer${
                    offers.length === 2 ? '' : 's'
                  }`}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              testID="mbsx-accept"
              style={[
                styles.button,
                !selectedSwap || !acceptable(selectedSwap) || accepting
                  ? styles.buttonDisabled
                  : null,
              ]}
              disabled={!selectedSwap || !acceptable(selectedSwap) || accepting}
              onPress={onAccept}>
              <Text style={styles.buttonText}>
                {accepting ? 'Accepting…' : 'Accept offer'}
              </Text>
            </TouchableOpacity>
            {acceptError !== '' ? (
              <Text testID="mbsx-accept-error" style={styles.error}>
                {acceptError}
              </Text>
            ) : null}
          </>
        )}

        <RemoveButton
          testID="mbsx-remove-request"
          label="Delete request"
          confirm="Permanently delete this request and every offer under it?"
          onConfirm={async () => {
            await removeRequest(requestId);
            navigation.navigate('RequestList');
            return 'Removed';
          }}
        />
      </ScrollView>
    </View>
  );
};

export default RequestDetail;
