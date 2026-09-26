import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {
  formatExpiry,
  formatTimestamp,
  kindLabel,
  shortAddress,
} from '../format';
import {getMbsxStyles} from '../theme';
import {offerWarning} from '../useSwapAmounts';
import MbsxBackButton from '../components/MbsxBackButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import {requestStateText, swapStateText, useShowRawStates} from '../stateText';
import {
  BUSY,
  acceptOffer,
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
  SwapOffer,
  SwapRequestDetails,
} from '../types';

type Props = DrawerScreenProps<MbsxDrawerParamList, 'RequestDetail'>;

// Everything a swap can be before it is signed. Anything else and it is under
// way, so the request page is no longer the thing to look at.
const PRE_ACCEPT = new Set([
  'SENT',
  'RECEIVING',
  'RECEIVED',
  'RECEIVING_ACC',
  'EXPIRED',
  'REJECTED',
]);

const explainReliability = () =>
  Alert.alert(
    'Reliability',
    'A score out of 100 for this offerer, from swaps the server has seen from ' +
      'this exact address. 50 means it has not seen them before.',
  );

const rate = (offer: SwapOffer) =>
  Number(offer.amount_receive) / Number(offer.amount_send);

const live = (offer: SwapOffer) =>
  offer.state === 'RECEIVED' && Date.parse(`${offer.expire_at}Z`) > Date.now();

const RequestDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const showRaw = useShowRawStates();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <MbsxBackButton onPress={() => navigation.goBack()} />,
      headerTitleContainerStyle: {left: 7},
    });
  }, [navigation]);

  const {requestId} = route.params;
  const [request, setRequest] = useState<SwapRequestDetails | null>(null);
  const [swaps, setSwaps] = useState<SwapDetails[]>([]);
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

  // Unfocused, a stale id's error must not navigate away from the screen shown.
  useFocusEffect(
    useCallback(() => {
      fetchRequest();
      const subscription = onMessage(fetchRequest);
      return () => subscription.remove();
    }, [fetchRequest]),
  );

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

  const offers = [...(request?.offers ?? [])].sort(
    (a, b) =>
      Number(b.kind === 'PRIVATE') - Number(a.kind === 'PRIVATE') ||
      rate(b) - rate(a),
  );
  const acceptedOffer = offers.find(offer => offer.accepted) ?? null;
  const canAccept = request?.state === 'OFFER_RECEIVED' && !accepting;

  // Accepting is what commits: the swap it brings back is signed without
  // asking again.
  const onAccept = (offer: SwapOffer) => {
    const run = async () => {
      setAccepting(true);
      setAcceptError('');
      try {
        const rv = await acceptOffer(offer.id);
        if (rv.error) {
          setAcceptError(rv.error);
          return;
        }
        fetchRequest();
      } catch (e) {
        setAcceptError((e as Error).message);
      } finally {
        setAccepting(false);
      }
    };
    Alert.alert(
      'Accept offer',
      `Send ${offer.amount_send} ${offer.coin_send} for ${offer.amount_receive} ${offer.coin_receive}?\n\nThe swap starts on its own once the offer is set up.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Accept', onPress: run},
      ],
    );
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No request selected</Text>
      </View>
    );
  }

  const offerStatus = (offer: SwapOffer): string => {
    if (offer.accepted) {
      return swaps.length > 0 ? 'Accepted' : 'Accepted, waiting for the swap';
    }
    if (offer.state === 'REVOKED') {
      return 'Withdrawn by the offerer';
    }
    if (offer.state === 'REJECTED') {
      return "The server's swap did not match this offer";
    }
    if (!live(offer)) {
      return `Expired ${formatExpiry(offer.expire_at)}`;
    }
    return canAccept
      ? `Tap to accept. Expires ${formatExpiry(offer.expire_at)}`
      : `Expires ${formatExpiry(offer.expire_at)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={swapCards.section}>Send</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            <Text style={swapCards.amount} numberOfLines={1} adjustsFontSizeToFit>
              {request.amount_from}
            </Text>
            <View style={swapCards.coinPill}>
              {COIN_ICONS[request.coin_from] ? (
                <Image
                  source={COIN_ICONS[request.coin_from]}
                  style={swapCards.coinLogo}
                />
              ) : null}
              <Text style={swapCards.coinPillText}>{request.coin_from}</Text>
            </View>
          </View>
          <Text style={swapCards.status}>{requestStateText(request.state)}</Text>
          {showRaw ? <Text style={swapCards.id}>{request.state}</Text> : null}
          <Text style={swapCards.fromLine}>
            {`Created ${formatTimestamp(request.created_at)}`}
          </Text>
          <Text style={swapCards.meta}>
            {`Expires ${formatTimestamp(request.expire_at)}`}
          </Text>
        </View>

        <View style={swapCards.flipWrap}>
          <View style={swapCards.flipLine} />
          <View style={swapCards.flip}>
            <Image
              source={require('../../../assets/icons/switch-arrow.png')}
              style={swapCards.flipIcon}
            />
          </View>
        </View>

        <Text style={swapCards.section}>Receive</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            <Text style={swapCards.amount} numberOfLines={1} adjustsFontSizeToFit>
              {request.min_amount_to}
            </Text>
            <View style={swapCards.coinPill}>
              {COIN_ICONS[request.coin_to] ? (
                <Image
                  source={COIN_ICONS[request.coin_to]}
                  style={swapCards.coinLogo}
                />
              ) : null}
              <Text style={swapCards.coinPillText}>{request.coin_to}</Text>
            </View>
          </View>
          <Text style={swapCards.meta}>At least</Text>
        </View>

        <Text style={swapCards.section}>Fees</Text>
        <View style={swapCards.card}>
          {(request.fees ?? []).length === 0 ? (
            <Text style={swapCards.note}>No fees configured</Text>
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
              <Text style={swapCards.note}>
                {swaps.length === 0
                  ? `Paid in the ${request.fees_coin} you send, whichever offer you accept. The exact amount follows the offer.`
                  : 'Chain fees under the swap below.'}
              </Text>
            </>
          )}
        </View>

        <Text style={swapCards.section}>Offers</Text>
        {offers.map(offer => {
          const warning = offerWarning(offer);
          return (
            <TouchableOpacity
              key={offer.id}
              testID={`mbsx-offer-${offer.id}`}
              style={[
                swapCards.card,
                acceptedOffer !== null && !offer.accepted
                  ? styles.rowDimmed
                  : null,
              ]}
              disabled={!canAccept || !live(offer)}
              onPress={() => onAccept(offer)}>
              <Text style={styles.rowPrimary}>
                {`${kindLabel(offer.kind)} — send ${offer.amount_send} ${offer.coin_send}, receive ${offer.amount_receive} ${offer.coin_receive}`}
              </Text>
              {Number(offer.amount_send) < Number(request.amount_from) ? (
                <Text style={styles.rowMessage}>
                  {`Of the ${request.amount_from} ${request.coin_from} you offered; the rest comes back as change`}
                </Text>
              ) : null}
              {warning ? (
                <Text
                  testID={`mbsx-offer-warning-${offer.id}`}
                  style={styles.error}>
                  {warning}
                </Text>
              ) : null}
              {offer.kind === 'BRIDGED' ? (
                <>
                  <Text style={styles.rowMessage}>
                    {`From ${shortAddress(offer.offerer_address ?? '')}`}
                  </Text>
                  <TouchableOpacity
                    testID={`mbsx-reliability-${offer.id}`}
                    onPress={explainReliability}>
                    <Text style={styles.rowLink}>
                      {`Reliability: ${offer.offerer_reliability}`}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <Text style={styles.rowMessage}>{offerStatus(offer)}</Text>
            </TouchableOpacity>
          );
        })}
        {acceptError !== '' ? (
          <Text testID="mbsx-accept-error" style={styles.error}>
            {acceptError}
          </Text>
        ) : null}
        {offers.length === 0 ? (
          <View style={swapCards.card}>
            <Text style={swapCards.note}>Waiting for an offer</Text>
          </View>
        ) : null}

        {swaps.length > 0 ? <Text style={swapCards.section}>Swap</Text> : null}
        {swaps.map(swap => (
          <TouchableOpacity
            key={swap.id}
            testID={`mbsx-swap-${swap.id}`}
            style={swapCards.card}
            onPress={() =>
              navigation.navigate('SwapDetail', {swapId: swap.id})
            }>
            <Text style={styles.rowPrimary}>
              {swapStateText(swap.state, swap.coin_from, swap.coin_to)}
            </Text>
            {showRaw ? <Text style={swapCards.id}>{swap.state}</Text> : null}
            {swap.kind ? (
              <Text style={swapCards.meta}>{kindLabel(swap.kind)}</Text>
            ) : null}
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
        ))}

        <Text testID="mbsx-request-id" style={swapCards.id} selectable>
          {request.id}
        </Text>

        <RemoveButton
          testID="mbsx-remove-request"
          label="Delete request"
          confirm="Permanently delete this request and every offer under it?"
          disabled={underway !== undefined}
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
