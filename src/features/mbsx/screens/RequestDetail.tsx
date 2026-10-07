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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerScreenProps} from '@react-navigation/drawer';

import {ScreenSizeContext} from '../../../context/screenSize';
import {useAppSelector} from '../../../store/hooks';
import {triggerLightFeedback} from '../../../utils/haptic';
import {
  formatExpiry,
  formatTimestamp,
  kindLabel,
  raisedFeeNote,
  shortAddress,
} from '../format';
import {colors, getMbsxStyles} from '../theme';
import {independentReference, refreshRates} from '../rates';
import {getNetwork} from '../network';
import {coinString, offerWarning} from '../useSwapAmounts';
import CoinPair from '../components/CoinPair';
import {TimeLine} from '../components/Clock';
import {useBottomInset} from '../components/useBottomInset';
import MbsxBackButton from '../components/MbsxBackButton';
import CopyButton from '../components/CopyButton';
import {COIN_ICONS, swapCards} from '../swapCards';
import {requestStateText, swapStateText, useShowRawStates} from '../stateText';
import {
  BUSY,
  acceptOffer,
  getRequestInfo,
  getSwapInfo,
  isUnderwayState,
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

const explainReliability = () =>
  Alert.alert(
    'Reliability',
    'A score out of 100 for this offerer, from swaps the server has seen from ' +
      'this exact address. 50 means it has not seen them before.',
  );

const rate = (offer: SwapOffer) => {
  const send = Number(offer.amount_send);
  const receive = Number(offer.amount_receive);
  if (!send || !receive) {
    return 0;
  }
  return receive / send;
};

const live = (offer: SwapOffer) =>
  offer.state === 'RECEIVED' && Date.parse(`${offer.expire_at}Z`) > Date.now();

const RequestDetail: React.FC<Props> = ({route, navigation}) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getMbsxStyles(SCREEN_HEIGHT);
  const bottom = useBottomInset();
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
  const [pendingOffer, setPendingOffer] = useState<SwapOffer | null>(null);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [feesOpen, setFeesOpen] = useState(false);
  const rates = useAppSelector(state => state.mbsx.rates ?? {});

  useEffect(() => {
    setPendingOffer(null);
    setAcceptError('');
  }, [requestId]);

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
      refreshRates();
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

  const underway = swaps.find(swap => isUnderwayState(swap.state));
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
      rate(b) - rate(a) ||
      Number(b.kind === 'PRIVATE') - Number(a.kind === 'PRIVATE'),
  );
  const bestOfferId = offers.find(offer => live(offer))?.id;
  const acceptedOffer = offers.find(offer => offer.accepted) ?? null;
  const canAccept = request?.state === 'OFFER_RECEIVED' && !accepting;

  // Accepting is what commits: the swap it brings back is signed without
  // asking again.
  const onAccept = (offer: SwapOffer) => {
    setPendingOffer(offer);
  };

  const confirmAccept = async () => {
    const offer = pendingOffer;
    if (!offer) {
      return;
    }
    triggerLightFeedback();
    setAccepting(true);
    setAcceptError('');
    try {
      const rv = await acceptOffer(offer.id);
      if (rv.error) {
        setAcceptError(rv.error);
        return;
      }
      setPendingOffer(null);
      fetchRequest();
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

  const offerStatus = (offer: SwapOffer): string | null => {
    if (offer.accepted) {
      return swaps.length > 0
        ? 'The offer was accepted'
        : 'The offer was accepted and is waiting for the swap';
    }
    if (offer.state === 'REVOKED') {
      return 'Withdrawn by the Offerer';
    }
    if (offer.state === 'REJECTED') {
      return "The server's swap did not match this offer";
    }
    if (!live(offer)) {
      return `Expired ${formatExpiry(offer.expire_at)}`;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: bottom}]}
        keyboardShouldPersistTaps="handled">
        <Text style={swapCards.section}>Send</Text>
        <View style={swapCards.card}>
          <View style={swapCards.amountRow}>
            <Text style={swapCards.amount} numberOfLines={1} adjustsFontSizeToFit>
              {request.amount_from}
            </Text>
            <View style={[swapCards.coinPill, look.coinGap]}>
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
          <TimeLine
            text={`Expires ${formatTimestamp(request.expire_at)}`}
          />
          <View style={look.idRow}>
            <View style={look.idPill}>
              <Text style={look.idLabel}>Request</Text>
              <Text style={look.idValue} numberOfLines={1}>
                {shortAddress(request.id)}
              </Text>
            </View>
            <CopyButton
              testID={`mbsx-request-id-${request.id}`}
              label="Copy Request ID"
              value={request.id}
              style={look.iconBtn}
            />
          </View>
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
            <View style={[swapCards.coinPill, look.coinGap]}>
              {COIN_ICONS[request.coin_to] ? (
                <Image
                  source={COIN_ICONS[request.coin_to]}
                  style={swapCards.coinLogo}
                />
              ) : null}
              <Text style={swapCards.coinPillText}>{request.coin_to}</Text>
            </View>
          </View>
          <Text style={swapCards.meta}>
            Offers below this need your approval
          </Text>
        </View>

        <Text style={[swapCards.section, look.feesHeading]}>Fees</Text>
        <View style={swapCards.card}>
          {(request.fees ?? []).length === 0 ? (
            <Text style={swapCards.note}>No fees configured</Text>
          ) : (
            <>
              {feesOpen
                ? request.fees?.map((fee, index) => (
                    <View
                      key={fee.desc}
                      style={[look.feeRow, index > 0 ? look.feeLine : null]}>
                      <Text style={look.feeLabel}>{fee.desc}</Text>
                      <Text style={look.feePct}>
                        {`${Number(fee.bps) / 100}%`}
                      </Text>
                      <Text style={look.feeValue}>
                        {`${fee.amount} ${request.fees_coin}`}
                      </Text>
                    </View>
                  ))
                : null}
              <TouchableOpacity
                testID="mbsx-request-fees"
                accessibilityRole="button"
                accessibilityState={{expanded: feesOpen}}
                style={[look.feeRow, feesOpen ? look.feeTotal : null]}
                onPress={() => setFeesOpen(shown => !shown)}>
                <Text style={[look.feeTotalLabel, look.feeToggle]}>Total</Text>
                <Text style={look.feePct}>
                  {`${
                    (request.fees ?? []).reduce(
                      (sum, fee) => sum + Number(fee.bps),
                      0,
                    ) / 100
                  }%`}
                </Text>
                <Text style={look.feeTotalValue}>
                  {`${request.fees_total} ${request.fees_coin}`}
                </Text>
              </TouchableOpacity>
              <Text style={look.feeNote}>
                {swaps.length === 0
                  ? `Taken from the ${request.fees_coin} you send, whichever offer you accept. The exact amount follows the offer.`
                  : 'Chain fees are under the swap below.'}
              </Text>
            </>
          )}
        </View>

        <Text style={swapCards.section}>Offers</Text>
        {offers.map(offer => {
          const rateWarning = offerWarning(
            offer,
            independentReference(
              rates,
              offer.coin_send,
              offer.coin_receive,
              Date.now() / 1000,
            ),
            getNetwork() !== 'regtest',
          );
          const shortfall = offer.below_minimum
            ? `You would receive ${offer.shortfall} ${offer.coin_receive} less than your minimum.`
            : null;
          const shortLock =
            offer.short_lock && offer.lock_time
              ? `This offer's lock time is only ${Math.round(offer.lock_time / 360) / 10} hours. Keep your phone online until the swap completes: if it stalls and your phone is offline that long, you could lose funds.`
              : null;
          const warning =
            [shortfall, shortLock, rateWarning].filter(Boolean).join(' ') ||
            null;
          const ackKey = `${offer.id}:${warning}`;
          const held = warning !== null && !acknowledged.includes(ackKey);
          const status = offerStatus(offer);
          const kind = kindLabel(offer.kind);
          const open = live(offer);
          const confirming = pendingOffer?.id === offer.id;
          const dimmed =
            (acceptedOffer !== null && !offer.accepted) ||
            (pendingOffer !== null && !confirming);
          return (
            <View
              key={offer.id}
              testID={`mbsx-offer-${offer.id}`}
              style={[swapCards.card, dimmed ? styles.rowDimmed : null]}>
              {open || offer.id === bestOfferId || kind ? (
                <View style={look.offerHead}>
                  <View style={look.offerMarks}>
                    {offer.id === bestOfferId ? (
                      <Text testID={`mbsx-best-rate-${offer.id}`} style={look.best}>
                        Best Rate
                      </Text>
                    ) : null}
                    {kind ? <Text style={look.offerKind}>{kind}</Text> : null}
                  </View>
                  {open ? (
                    <Text style={look.offerExpiry}>{formatExpiry(offer.expire_at)}</Text>
                  ) : null}
                </View>
              ) : null}
              <View style={swapCards.amountRow}>
                <Text
                  style={swapCards.amount}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {offer.amount_receive}
                </Text>
                <View style={swapCards.coinPill}>
                  {COIN_ICONS[offer.coin_receive] ? (
                    <Image
                      source={COIN_ICONS[offer.coin_receive]}
                      style={swapCards.coinLogo}
                    />
                  ) : null}
                  <Text style={swapCards.coinPillText}>{offer.coin_receive}</Text>
                </View>
              </View>
              <Text style={swapCards.meta}>
                {`for ${offer.amount_send} ${offer.coin_send}`}
              </Text>
              {rate(offer) > 0 ? (
                <Text style={styles.rowMessage}>
                  {`1 ${offer.coin_send} ≈ ${coinString(rate(offer))} ${offer.coin_receive}`}
                </Text>
              ) : null}
              {Number(offer.amount_send) < Number(request.amount_from) ? (
                <Text style={styles.rowMessage}>
                  {`Of the ${request.amount_from} ${request.coin_from} you offered; the rest comes back as change`}
                </Text>
              ) : null}
              <OfferFees offer={offer} styles={styles} />
              {warning ? (
                <TouchableOpacity
                  testID={`mbsx-offer-warning-${offer.id}`}
                  onPress={() =>
                    setAcknowledged(ids =>
                      ids.includes(ackKey) ? ids : [...ids, ackKey],
                    )
                  }>
                  <Text style={styles.error}>
                    {held
                      ? `${warning} Tap this warning to accept anyway.`
                      : warning}
                  </Text>
                </TouchableOpacity>
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
                      {`Reliability ${offer.offerer_reliability ?? 0}`}
                    </Text>
                    <View style={look.barTrack}>
                      <View
                        style={[
                          look.barFill,
                          {
                            width: `${Math.max(
                              0,
                              Math.min(100, Number(offer.offerer_reliability ?? 0)),
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </>
              ) : null}
              {status ? <Text style={styles.rowMessage}>{status}</Text> : null}
              {confirming ? (
                <View testID="mbsx-accept-confirm">
                  <Text style={[swapCards.note, look.confirmNote, look.confirmBold]}>
                    {`Send ${offer.amount_send} ${offer.coin_send} for ${offer.amount_receive} ${offer.coin_receive}. The swap starts on its own once the offer is set up.`}
                  </Text>
                  {acceptError !== '' ? (
                    <Text testID="mbsx-accept-error" style={styles.error}>
                      {acceptError}
                    </Text>
                  ) : null}
                  <View style={look.confirmActions}>
                    <TouchableOpacity
                      testID="mbsx-accept-cancel"
                      style={[styles.buttonSecondary, look.confirmAction]}
                      onPress={() => {
                        setPendingOffer(null);
                        setAcceptError('');
                      }}
                      disabled={accepting}>
                      <Text style={styles.buttonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="mbsx-accept-confirm-button"
                      style={[
                        styles.button,
                        look.confirmAction,
                        held ? styles.buttonDisabled : null,
                      ]}
                      onPress={() => void confirmAccept()}
                      disabled={accepting || held}>
                      <Text style={styles.buttonText}>
                        {accepting ? 'Accepting…' : 'Accept'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              {canAccept && open && pendingOffer === null ? (
                <TouchableOpacity
                  testID={`mbsx-accept-${offer.id}`}
                  style={[
                    styles.button,
                    look.acceptButton,
                    held ? styles.buttonDisabled : null,
                  ]}
                  disabled={held}
                  onPress={() => onAccept(offer)}>
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
        {offers.length === 0 ? (
          <View style={swapCards.card}>
            <TimeLine
              text="Waiting for an offer"
              textStyle={look.waitText}
            />
            <Text style={look.waitNote}>
              Offers usually arrive within a few minutes. You can leave this
              screen.
            </Text>
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
            <View style={swapCards.historyRow}>
              <CoinPair from={swap.coin_from} to={swap.coin_to} size={36} />
              <View style={swapCards.historyMid}>
                <Text style={swapCards.historyTitle}>
                  {swapStateText(swap.state, swap.coin_from, swap.coin_to)}
                </Text>
                {showRaw ? (
                  <Text style={swapCards.historySub}>{swap.state}</Text>
                ) : null}
                {swap.kind ? (
                  <Text style={swapCards.historySub}>{kindLabel(swap.kind)}</Text>
                ) : null}
              </View>
            </View>
            <View style={look.swapAmounts}>
              <View style={swapCards.historyRow}>
                {COIN_ICONS[swap.coin_from] ? (
                  <Image
                    source={COIN_ICONS[swap.coin_from]}
                    style={swapCards.coinLogo}
                  />
                ) : null}
                <Text style={swapCards.historyTitle}>
                  {`${swap.amount_from} ${swap.coin_from}`}
                </Text>
              </View>
              <View style={[swapCards.historyRow, look.swapAmountNext]}>
                {COIN_ICONS[swap.coin_to] ? (
                  <Image
                    source={COIN_ICONS[swap.coin_to]}
                    style={swapCards.coinLogo}
                  />
                ) : null}
                <Text style={swapCards.historyTitle}>
                  {`${swap.amount_to} ${swap.coin_to}`}
                </Text>
              </View>
            </View>
            {swap.fees_coin ? (
              <View style={[look.feeRow, look.feeFirst]}>
                <Text style={look.feeLabel}>Swap Fees</Text>
                <Text style={look.feeValue}>
                  {`${swap.fees_total} ${swap.fees_coin}`}
                </Text>
              </View>
            ) : null}
            {(
              [
                [swap.coin_from, swap.chain_fee_from, swap.fee_rate_from],
                [swap.coin_to, swap.chain_fee_to, swap.fee_rate_to],
              ] as [string, string | undefined, bigint][]
            ).map(([coin, amount, feeRate], index) => (
              <View
                key={coin}
                style={[
                  look.feeRow,
                  swap.fees_coin || index > 0 ? look.feeLine : look.feeFirst,
                ]}>
                <Text style={look.feeLabel}>{`Chain Fee ${coin}`}</Text>
                <Text style={look.feeRate}>{`${feeRate} sat/kvB`}</Text>
                <Text style={look.feeValue}>{`~${amount ?? '?'}`}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}

        <RemoveButton
          testID="mbsx-remove-request"
          label="Delete Request"
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

const OfferFees = ({
  offer,
  styles,
}: {
  offer: SwapOffer;
  styles: ReturnType<typeof getMbsxStyles>;
}) => {
  const [open, setOpen] = useState(false);
  if (offer.fees === undefined) {
    return null;
  }
  if (offer.fees.length === 0) {
    return <Text style={styles.rowMessage}>No swap fee</Text>;
  }
  const bps = Number(offer.fees_bps ?? 0);
  return (
    <>
      <TouchableOpacity
        testID={`mbsx-offer-fee-${offer.id}`}
        onPress={() => setOpen(shown => !shown)}>
        <Text style={styles.rowLink}>
          {bps > 0
            ? `Swap fee ${bps / 100}% (${offer.fees_total} ${offer.fees_coin})`
            : 'Swap fee paid by provider'}
        </Text>
      </TouchableOpacity>
      {offer.fees_raised && offer.nominal_fee_bps !== undefined ? (
        <Text
          testID={`mbsx-offer-fee-raised-${offer.id}`}
          style={styles.rowMessage}>
          {raisedFeeNote(offer.nominal_fee_bps)}
        </Text>
      ) : null}
      {open
        ? offer.fees.map((fee, index) => (
            <View key={`${index}`}>
              <View style={[look.feeRow, index > 0 ? look.feeLine : null]}>
                <Text style={look.feeLabel}>{fee.desc || 'Fee'}</Text>
                <Text style={look.feePct}>{`${Number(fee.bps) / 100}%`}</Text>
                <Text style={look.feeValue}>
                  {`${fee.amount} ${fee.coin ?? ''}`}
                </Text>
              </View>
              {fee.paid_by === 'PROVIDER' ? (
                <Text style={styles.rowMessage}>Fee paid by provider</Text>
              ) : null}
            </View>
          ))
        : null}
    </>
  );
};

const look = StyleSheet.create({
  waitText: {
    marginTop: 0,
    color: '#484859',
  },
  waitNote: {
    marginTop: 8,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  idPill: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  idLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
    marginBottom: 2,
  },
  idValue: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  toolIcon: {
    width: 18,
    height: 18,
    tintColor: '#484859',
  },
  barTrack: {
    marginTop: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E8EE',
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2C72FF',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  confirmAction: {
    flex: 1,
    marginVertical: 0,
  },
  offerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  offerMarks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 8,
  },
  offerKind: {
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: '#747E87',
  },
  offerExpiry: {
    marginLeft: 8,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: '#747E87',
  },
  best: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 13,
    color: '#2C72FF',
  },
  acceptButton: {
    marginTop: 12,
    marginBottom: 0,
  },
  confirmNote: {
    marginTop: 12,
  },
  confirmBold: {
    fontWeight: '700',
    color: '#484859',
  },
  feesHeading: {
    marginTop: 18,
  },
  coinGap: {
    marginLeft: 16,
  },
  feeFirst: {
    marginTop: 14,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  feeLine: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  feeLabel: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#484859',
  },
  feePct: {
    width: 56,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: '#747E87',
  },
  feeRate: {
    marginLeft: 8,
    fontFamily: 'Satoshi Variable',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'right',
  },
  swapAmounts: {
    marginTop: 12,
  },
  swapAmountNext: {
    marginTop: 6,
  },
  feeValue: {
    minWidth: 110,
    marginLeft: 8,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    color: '#484859',
  },
  feeTotal: {
    borderTopWidth: 1,
    borderTopColor: '#D5DBE4',
    marginTop: 2,
  },
  feeTotalLabel: {
    flex: 1,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#484859',
  },
  feeTotalValue: {
    minWidth: 110,
    marginLeft: 8,
    textAlign: 'right',
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 14,
    color: '#484859',
  },
  feeToggle: {
    color: colors.primary,
  },
  feeNote: {
    marginTop: 10,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: '#747E87',
  },
});

export default RequestDetail;
