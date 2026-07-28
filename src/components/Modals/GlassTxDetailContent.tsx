import React, {
  Fragment,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';
import type {NativeGesture} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import Share from 'react-native-share';

import InputActionField from '../InputActionField';
import ChangeAddress from '../ChangeAddress';
import TranslateText from '../TranslateText';
import {
  getTxTitleMeta,
  useTxExplorerUrl,
  useTxSenderAndFee,
} from './useTxDetailData';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {IDisplayedTx, labelTransaction} from '../../reducers/transaction';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  currencySymbolSelector,
  getCurrencySymbol,
} from '../../reducers/settings';
import {convertLocalFiatToUSD} from '../../reducers/ticker';
import {formatTxDate} from '../../utils/date';
import {isBuySellMetadata, isConvertMetadata} from '../../utils/txMetadata';
import {ScreenSizeContext} from '../../context/screenSize';

// Apple-Pay-sheet styled content: title + hero amount directly on the glass,
// details grouped into near-opaque white cards with hairline separators, and
// chevron action rows. Everything the old TxDetailModalContent showed is here,
// plus a status/confirmations row.

const PRIMARY_TEXT = '#2E2E2E';
const SECONDARY_TEXT = '#747E87';
const HAIRLINE = 'rgba(60, 60, 67, 0.18)';
const CARD_BACKGROUND = 'rgba(255, 255, 255, 0.96)';
const CONFIRMED_GREEN = '#1ebc73';
const PENDING_AMBER = '#f5a623';
const CONFS_TARGET = 6;

interface Props {
  transaction: IDisplayedTx;
  contentScrollY: SharedValue<number>;
  // RNGH native gesture wrapping the ScrollView, so the overlay's dismiss pan
  // can run simultaneously with the scroll.
  nativeScrollGesture: NativeGesture;
}

function GlassTxDetailContent(props: Props) {
  const {transaction, contentScrollY, nativeScrollGesture} = props;
  const scrollViewRef = useRef<any>(null);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const {allInputAddrs, fetchedTxFee} = useTxSenderAndFee(transaction);
  const currentExplorer = useTxExplorerUrl(transaction);
  const {textKey, amountColor} = getTxTitleMeta(transaction);

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      contentScrollY.value = e.contentOffset.y;
    },
  });

  // Content crossfade whenever the shown transaction changes; the scroll
  // starts from the top for the new transaction.
  const fadeNewDetailsOpacity = useSharedValue(1);
  const fadeNewDetailsIn = useAnimatedStyle(() => ({
    opacity: fadeNewDetailsOpacity.value,
  }));
  useEffect(() => {
    fadeNewDetailsOpacity.value = 0;
    fadeNewDetailsOpacity.value = withTiming(1, {duration: 500});
    scrollViewRef.current?.scrollTo?.({y: 0, animated: false});
     
  }, [transaction, fadeNewDetailsOpacity]);

  const label = transaction.label || '';
  const [newLabel, setNewLabel] = useState(label === ' ' ? '' : label);
  useEffect(() => {
    setNewLabel(label === ' ' ? '' : label);
  }, [label]);

  // Collapsed "+ N more" address lists expand on tap; collapse again when the
  // shown transaction changes.
  const [showAllInputs, setShowAllInputs] = useState(false);
  const [showAllOutputs, setShowAllOutputs] = useState(false);
  const [showAllChange, setShowAllChange] = useState(false);
  useEffect(() => {
    setShowAllInputs(false);
    setShowAllOutputs(false);
    setShowAllChange(false);
  }, [transaction]);

  if (!transaction || transaction.hash === undefined) {
    return null;
  }

  const cryptoAmount = convertToSubunit(transaction.amount);
  let cryptoAmountFormatted = cryptoAmount.toString();
  if (cryptoAmountFormatted.match(/\./)) {
    cryptoAmountFormatted = cryptoAmountFormatted.replace(/\.?0+$/, '');
  }
  const dateString = formatTxDate(transaction.timestamp);
  const priceOnDateInLocalFiat = transaction.priceOnDate / localFiatToUSD;
  const amountInFiatOnDateAbsVal = Math.abs(
    priceOnDateInLocalFiat * (transaction.amount / 100000000),
  ).toFixed(2);

  const myOutputs = transaction.myOutputs || [];
  const otherOutputs = transaction.otherOutputs || [];
  const isSend = transaction.metaLabel === 'Send';
  const isMweb = transaction.isMweb;

  // Buy/sell provider fields (fees come from the provider, not the explorer).
  const provider = isBuySellMetadata(transaction.providerMeta)
    ? {
        fiatSymbol: transaction.providerMeta.fiatCurrency
          ? getCurrencySymbol(transaction.providerMeta.fiatCurrency)
          : '$',
        providerTxId: transaction.providerMeta.providerTxId,
        cryptoTxId: transaction.providerMeta.cryptoTxId,
        fiatCurrencyAmount: transaction.providerMeta.fiatCurrencyAmount,
        cryptoCurrencyAmount: transaction.providerMeta.cryptoCurrencyAmount,
        totalFee: transaction.providerMeta.totalFee,
        blockchainFee: transaction.providerMeta.blockchainFee,
        tipLFFee: transaction.providerMeta.tipLFFee,
        providerFee: transaction.providerMeta.providerFee,
        txDetailsUrl: transaction.providerMeta.txDetailsUrl,
        status: transaction.providerMeta.status,
      }
    : null;

  const blockchainFee: number | 'unknown' = fetchedTxFee || 'unknown';

  const labelTx = (labelProp: string) => {
    if (transaction.label !== labelProp) {
      dispatch(labelTransaction(transaction.hash, labelProp));
    }
  };

  const handleShare = (message: string) => {
    if (message) {
      Share.open({message: message});
    }
  };

  const openWebPage = (uri: string) => {
    if (!uri) {
      return;
    }
    navigation.navigate('WebPage', {uri});
  };

  // --- shared building blocks ---

  const hairline = <View style={styles.hairline} />;

  const cardRow = (opts: {
    titleTextKey?: string;
    titleDomain?: string;
    titleTextValue?: string;
    valueTextKey?: string;
    valueDomain?: string;
    value?: string;
    valueColor?: string;
    smallValue?: boolean;
    chevron?: boolean;
    dotColor?: string;
    onPress?: () => void;
    key?: string;
  }) => (
    <TouchableOpacity
      key={opts.key}
      style={styles.cardRow}
      activeOpacity={opts.onPress ? 0.6 : 1}
      onPress={opts.onPress}
      disabled={!opts.onPress}>
      <TranslateText
        textKey={opts.titleTextKey}
        textValue={opts.titleTextValue}
        domain={opts.titleDomain || 'main'}
        maxSizeInPixels={SCREEN_HEIGHT * 0.017}
        textStyle={styles.cardRowTitle}
        numberOfLines={1}
      />
      <View style={styles.cardRowRight}>
        {opts.dotColor ? (
          <View style={[styles.statusDot, {backgroundColor: opts.dotColor}]} />
        ) : null}
        <TranslateText
          textKey={opts.valueTextKey}
          textValue={opts.value}
          domain={opts.valueDomain || 'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.cardRowValue,
            ...(opts.smallValue ? styles.cardRowValueSmall : {}),
            ...(opts.valueColor ? {color: opts.valueColor} : {}),
          }}
          numberOfLines={opts.smallValue ? 2 : 1}
        />
        {opts.chevron ? (
          <TranslateText
            textValue={'›'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.024}
            textStyle={styles.chevron}
            numberOfLines={1}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const card = (children: ReactNode, key?: string) => (
    <View style={styles.card} key={key}>
      {children}
    </View>
  );

  const feeSubRow = (titleKey: string, value: string) => (
    <View style={styles.feeSubRow} key={`sub-${titleKey}`}>
      <View style={styles.feeSubRowLeft}>
        <View style={styles.feeSubRowDot} />
        <TranslateText
          textKey={titleKey}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.016}
          textStyle={styles.cardRowTitle}
          numberOfLines={1}
        />
      </View>
      <TranslateText
        textValue={value}
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
        textStyle={styles.feeSubRowValue}
        numberOfLines={1}
      />
    </View>
  );

  // Status/confirmations — new detail the old modal never showed.
  const confirmationsRow = () => {
    const confirmed = transaction.confs >= CONFS_TARGET;
    return cardRow({
      titleTextKey: 'status',
      valueTextKey: confirmed ? 'confirmed' : undefined,
      value: confirmed ? undefined : `${transaction.confs}/${CONFS_TARGET}`,
      dotColor: confirmed ? CONFIRMED_GREEN : PENDING_AMBER,
    });
  };

  const providerStatusRow = () => {
    if (!provider) {
      return null;
    }
    const isPending = provider.status === 'pending';
    return cardRow({
      titleTextKey: 'status',
      valueTextKey: isPending ? 'pending' : undefined,
      value: isPending
        ? undefined
        : provider.status
          ? provider.status.charAt(0).toUpperCase() + provider.status.slice(1)
          : 'Unknown',
      dotColor:
        provider.status === 'completed' || provider.status === 'sent'
          ? CONFIRMED_GREEN
          : PENDING_AMBER,
    });
  };

  // --- addresses (ported from SendReceiveTxLayout / ConvertTxLayout) ---

  const ADDR_ROW_LIMIT = 2;
  const CHANGE_ADDR_ROW_LIMIT = 1;

  const addressText = (
    value: string,
    color: string,
    onPress?: () => void,
    key?: string,
  ) => (
    <TranslateText
      textValue={value}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={{...styles.addressText, color}}
      numberOfLines={4}
      key={key}
      onPress={onPress}
    />
  );

  const addressNote = (
    value: string | undefined,
    key?: string,
    onPress?: () => void,
    noteTextKey?: string,
  ) => (
    <TranslateText
      textValue={value}
      textKey={noteTextKey}
      domain={noteTextKey ? 'main' : undefined}
      maxSizeInPixels={SCREEN_HEIGHT * 0.02}
      textStyle={styles.addressNote}
      numberOfLines={1}
      key={key}
      onPress={onPress}
    />
  );

  // Tappable "+ N … address(es)" note for a collapsed address list.
  const moreNote = (
    hiddenCount: number,
    kind: string,
    expanded: boolean,
    onToggle: () => void,
    key: string,
    expandedTextKey: string = 'show_less',
  ) =>
    addressNote(
      expanded
        ? undefined
        : `+ ${hiddenCount} ${kind} ${
            hiddenCount > 1 ? 'addresses' : 'address'
          }`,
      key,
      onToggle,
      expanded ? expandedTextKey : undefined,
    );

  const renderSendReceiveInputs = () => {
    if (allInputAddrs.length > 0) {
      const limit = showAllInputs ? allInputAddrs.length : ADDR_ROW_LIMIT;
      return allInputAddrs
        .slice(0, limit)
        .map((input, index) =>
          addressText(
            input,
            '#2c72ff',
            () => handleShare(input),
            'input-' + index,
          ),
        );
    }
    return addressText('Unknown', '#2c72ff');
  };

  const renderSendReceiveOutputs = () => {
    // change address
    const changeLimit = showAllChange ? myOutputs.length : CHANGE_ADDR_ROW_LIMIT;
    const receiveLimit = showAllOutputs ? myOutputs.length : ADDR_ROW_LIMIT;
    const myOutputElements = myOutputs
      .slice(0, isSend ? changeLimit : receiveLimit)
      .map((output, index) =>
        addressText(
          output,
          isSend ? '#2c72ff' : CONFIRMED_GREEN,
          () => handleShare(output),
          'output-change-' + index,
        ),
      );

    // to address
    const otherOutputElements = otherOutputs
      .slice(0, showAllOutputs ? otherOutputs.length : ADDR_ROW_LIMIT)
      .map((output, index) =>
        addressText(
          output,
          CONFIRMED_GREEN,
          () => handleShare(output),
          'output-sent-' + index,
        ),
      );

    if (myOutputElements.length === 0 && otherOutputElements.length === 0) {
      return addressText('Unknown', CONFIRMED_GREEN);
    }
    if (isSend) {
      // does/doesn't have a change address
      if (myOutputElements.length > 0 && otherOutputElements.length > 0) {
        return [
          ...otherOutputElements,
          <ChangeAddress key="change">{myOutputElements}</ChangeAddress>,
        ];
      } else if (myOutputElements.length > 0) {
        // when change is the only recipient address then don't fold it
        return myOutputElements;
      }
      return otherOutputElements;
    }
    // receive modal doesn't show addresses not belonging to the user
    return myOutputElements;
  };

  const renderSendReceiveNotes = () =>
    allInputAddrs.length > ADDR_ROW_LIMIT
      ? moreNote(
          allInputAddrs.length - ADDR_ROW_LIMIT,
          'other input',
          showAllInputs,
          () => setShowAllInputs(prev => !prev),
          'inputs-note',
        )
      : null;

  const renderSendReceiveOutputNotes = () => {
    if (isSend) {
      return (
        <Fragment>
          {otherOutputs.length > ADDR_ROW_LIMIT
            ? moreNote(
                otherOutputs.length - ADDR_ROW_LIMIT,
                'other output',
                showAllOutputs,
                () => setShowAllOutputs(prev => !prev),
                'outputs-note',
              )
            : null}
          {myOutputs.length > CHANGE_ADDR_ROW_LIMIT
            ? moreNote(
                myOutputs.length - CHANGE_ADDR_ROW_LIMIT,
                'change',
                showAllChange,
                () => setShowAllChange(prev => !prev),
                'change-note',
                'show_less_change',
              )
            : null}
        </Fragment>
      );
    }
    return (
      <Fragment>
        {myOutputs.length > ADDR_ROW_LIMIT
          ? moreNote(
              myOutputs.length - ADDR_ROW_LIMIT,
              'more',
              showAllOutputs,
              () => setShowAllOutputs(prev => !prev),
              'more-own-note',
            )
          : null}
        {otherOutputs.length > 0
          ? addressNote(
              `+ ${otherOutputs.length} ${
                otherOutputs.length > 1 ? 'addresses' : 'address'
              } not belonging to you`,
              'stranger-note',
            )
          : null}
      </Fragment>
    );
  };

  const fromToSection = (
    fromContent: ReactNode | null,
    toContent: ReactNode,
  ) => (
    <View style={styles.fromToContainer}>
      {fromContent ? (
        <View style={styles.fromContainer}>
          <View style={styles.fromAndToIconContainer}>
            <View style={styles.fromAndToIcon}>
              <Image
                style={styles.fromAndToIconImage}
                source={require('../../assets/icons/send-icon.png')}
              />
            </View>
            <View style={styles.sentLine} />
          </View>
          <View style={styles.fromAndToTitlesContainer}>
            <TranslateText
              textKey={'from'}
              domain={'main'}
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.fromAndToTitle}
              numberOfLines={1}
            />
            {fromContent}
          </View>
        </View>
      ) : null}
      <View style={styles.toContainer}>
        <View style={styles.fromAndToIconContainer}>
          <View style={styles.fromAndToIcon}>
            <Image
              style={styles.fromAndToIconImage}
              source={require('../../assets/icons/receive-icon.png')}
            />
          </View>
        </View>
        <View style={styles.fromAndToTitlesContainer}>
          <TranslateText
            textKey={'to'}
            domain={'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.fromAndToTitle}
            numberOfLines={1}
          />
          {toContent}
        </View>
      </View>
    </View>
  );

  // --- cards shared across the per-type stacks ---

  const onChainDetailsCard = (withFee: boolean) =>
    card(
      <Fragment>
        {cardRow({
          titleTextKey: 'tx_id',
          value: transaction.hash,
          smallValue: true,
          onPress: () => handleShare(transaction.hash),
        })}
        {withFee ? (
          <Fragment>
            {hairline}
            {cardRow({
              titleTextKey: 'network_fee',
              value:
                blockchainFee !== 'unknown'
                  ? `${blockchainFee}${amountSymbol}`
                  : 'Unknown',
            })}
          </Fragment>
        ) : null}
      </Fragment>,
      'details-card',
    );

  const explorerActionCard = () =>
    card(
      cardRow({
        titleTextKey: 'view_on_blockchain',
        chevron: true,
        onPress: () => openWebPage(currentExplorer),
      }),
      'action-card',
    );

  // --- per-type card stacks ---

  const renderSendReceive = () => (
    <Fragment>
      {card(confirmationsRow(), 'status-card')}
      {card(
        fromToSection(
          isMweb ? null : (
            <Fragment>
              {renderSendReceiveInputs()}
              {renderSendReceiveNotes()}
              <View style={styles.addressGap} />
            </Fragment>
          ),
          <Fragment>
            {renderSendReceiveOutputs()}
            {renderSendReceiveOutputNotes()}
          </Fragment>,
        ),
        'address-card',
      )}
      {onChainDetailsCard(true)}
      {card(
        <View style={styles.inputFieldContainer}>
          <InputActionField
            value={newLabel}
            placeholder="Add label"
            onChangeText={(text: string) => setNewLabel(text)}
            onBlur={() => {}}
            onFocus={() => {}}
            clearInput={() => {
              setNewLabel('');
              labelTx('');
            }}
            onAction={() => labelTx(newLabel)}
          />
        </View>,
        'label-card',
      )}
      {explorerActionCard()}
    </Fragment>
  );

  const renderBuySell = () => {
    if (!provider) {
      // Transactions without valid provider metadata (e.g. metaLabel 'All')
      // still get the on-chain basics, like the old modal's fall-through did.
      return (
        <Fragment>
          {card(confirmationsRow(), 'status-card')}
          {onChainDetailsCard(true)}
          {explorerActionCard()}
        </Fragment>
      );
    }
    const isSell = transaction.metaLabel === 'Sell';
    const completedOrSent =
      provider.status === 'completed' || provider.status === 'sent';
    const showActions = completedOrSent || provider.status === 'pending';
    return (
      <Fragment>
        {card(providerStatusRow(), 'status-card')}
        {card(
          <Fragment>
            {cardRow({
              titleTextKey: 'total',
              value: isSell
                ? `${provider.cryptoCurrencyAmount}Ł (${provider.fiatSymbol}${provider.fiatCurrencyAmount})`
                : `${provider.fiatSymbol}${provider.fiatCurrencyAmount}`,
              valueColor: '#2c72ff',
            })}
            {isSell ? (
              <Fragment>
                {hairline}
                {cardRow({
                  titleTextKey: 'rate',
                  titleDomain: 'buyTab',
                  value: `${provider.fiatSymbol}${(
                    provider.fiatCurrencyAmount / provider.cryptoCurrencyAmount
                  ).toFixed(2)}`,
                  valueColor: '#2c72ff',
                })}
              </Fragment>
            ) : null}
          </Fragment>,
          'amounts-card',
        )}
        {card(
          <Fragment>
            {cardRow({
              titleTextKey: 'total_fee',
              value: `${provider.fiatSymbol}${provider.totalFee}`,
            })}
            {hairline}
            {feeSubRow(
              'network_fee',
              provider.blockchainFee !== 'unknown'
                ? `${provider.fiatSymbol}${provider.blockchainFee}`
                : 'unknown',
            )}
            {feeSubRow(
              'provider_fee',
              provider.tipLFFee !== 'unknown' &&
                provider.providerFee !== 'unknown'
                ? `${provider.fiatSymbol}${
                    Number(provider.tipLFFee) + Number(provider.providerFee)
                  }`
                : 'unknown',
            )}
          </Fragment>,
          'fees-card',
        )}
        {card(
          <Fragment>
            {cardRow({
              titleTextKey: 'moonpay_id',
              value: provider.providerTxId,
              smallValue: true,
              onPress: () => handleShare(provider.providerTxId),
            })}
            {hairline}
            {cardRow({
              titleTextKey: 'tx_id',
              valueTextKey:
                !completedOrSent && provider.status === 'pending'
                  ? 'pending'
                  : undefined,
              value: completedOrSent
                ? provider.cryptoTxId
                : provider.status === 'pending'
                  ? undefined
                  : 'Unknown',
              smallValue: true,
              onPress: completedOrSent
                ? () => handleShare(provider.cryptoTxId)
                : undefined,
            })}
          </Fragment>,
          'ids-card',
        )}
        {showActions
          ? card(
              <Fragment>
                {completedOrSent ? (
                  <Fragment>
                    {cardRow({
                      titleTextKey: 'blockchain',
                      chevron: true,
                      onPress: () => openWebPage(currentExplorer),
                    })}
                    {hairline}
                  </Fragment>
                ) : null}
                {cardRow({
                  titleTextKey: 'details',
                  chevron: true,
                  onPress: () => openWebPage(provider.txDetailsUrl),
                })}
              </Fragment>,
              'action-card',
            )
          : null}
      </Fragment>
    );
  };

  const renderConvert = () => {
    if (!isConvertMetadata(transaction.providerMeta)) {
      return null;
    }
    const meta = transaction.providerMeta;
    const outputDetails = meta.mergedOutputDetails || [];
    const formatSubunit = (sats: number) =>
      convertToSubunit(sats).toFixed(4).replace(/\.?0+$/, '');
    const targetAmountFormatted = formatSubunit(meta.targetAmount);

    // Our non-destination addresses are change (in MWEB an address can be
    // both input and output — normal).
    const changeAddrsWithAmounts = outputDetails
      .filter(
        output =>
          output.isOurAddress && output.address !== meta.destinationAddress,
      )
      .map(output => ({
        address: output.address,
        formattedAmount: formatSubunit(output.amount),
      }));

    const formattedUtxos = (meta.selectedUtxos || []).map(utxo => ({
      ...utxo,
      formattedAmount: formatSubunit(utxo.amountSat),
    }));

    const fromContent =
      formattedUtxos.length > 0
        ? formattedUtxos.map((utxo, index) =>
            addressText(
              `${utxo.address || 'Unknown'} (${utxo.formattedAmount}${amountSymbol})`,
              '#2c72ff',
              () => handleShare(utxo.address || ''),
              `input-${index}`,
            ),
          )
        : addressText('Unknown', '#2c72ff');

    const toContent = (
      <Fragment>
        {addressText(
          meta.destinationAddress
            ? `${meta.destinationAddress} (${targetAmountFormatted}${amountSymbol})`
            : `Unknown destination (${targetAmountFormatted}${amountSymbol})`,
          CONFIRMED_GREEN,
          () => handleShare(meta.destinationAddress),
        )}
        {changeAddrsWithAmounts.length > 0 ? (
          <ChangeAddress>
            {changeAddrsWithAmounts.map((changeOutput, index) =>
              addressText(
                `${changeOutput.address} (${changeOutput.formattedAmount}${amountSymbol})`,
                SECONDARY_TEXT,
                () => handleShare(changeOutput.address),
                `change-${index}`,
              ),
            )}
          </ChangeAddress>
        ) : null}
      </Fragment>
    );

    return (
      <Fragment>
        {card(confirmationsRow(), 'status-card')}
        {card(
          fromToSection(
            <Fragment>
              {fromContent}
              <View style={styles.addressGap} />
            </Fragment>,
            toContent,
          ),
          'address-card',
        )}
        {onChainDetailsCard(false)}
        {explorerActionCard()}
      </Fragment>
    );
  };

  const isSendReceive =
    transaction.metaLabel === 'Send' || transaction.metaLabel === 'Receive';
  const isConvert =
    transaction.metaLabel === 'Convert' &&
    isConvertMetadata(transaction.providerMeta);

  return (
    <Animated.View style={[styles.container, fadeNewDetailsIn]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <TranslateText
            textKey={textKey}
            domain={'main'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.03}
            textStyle={styles.headerTitle}
            numberOfLines={1}
          />
          <TranslateText
            textValue={`${cryptoAmountFormatted}${amountSymbol}`}
            maxSizeInPixels={SCREEN_HEIGHT * 0.038}
            textStyle={{...styles.heroAmount, color: amountColor}}
            numberOfLines={1}
          />
          <TranslateText
            textValue={`${currencySymbol}${amountInFiatOnDateAbsVal} · ${dateString}`}
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.heroFiat}
            numberOfLines={1}
          />
        </View>
      </View>
      {/* The overlay lifts the whole glass sheet above the keyboard, so no
          KeyboardAvoidingView is needed here. */}
      <GestureDetector gesture={nativeScrollGesture}>
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}>
          {isSendReceive
            ? renderSendReceive()
            : isConvert
              ? renderConvert()
              : renderBuySell()}
        </Animated.ScrollView>
      </GestureDetector>
    </Animated.View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: screenHeight * 0.024,
      paddingBottom: screenHeight * 0.014,
      paddingLeft: screenWidth * 0.055,
      // Clear the card-pinned close button.
      paddingRight: screenWidth * 0.055 + screenHeight * 0.05,
    },
    headerTitles: {
      flexShrink: 1,
      flexDirection: 'column',
    },
    headerTitle: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.019,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    heroAmount: {
      fontSize: screenHeight * 0.034,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      paddingTop: screenHeight * 0.004,
    },
    heroFiat: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.016,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      paddingTop: screenHeight * 0.002,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: screenWidth * 0.04,
      // Clears the home-indicator overlap and the page-control pill.
      paddingBottom: screenHeight * 0.055,
    },
    card: {
      width: '100%',
      backgroundColor: CARD_BACKGROUND,
      borderRadius: screenHeight * 0.028,
      paddingHorizontal: screenWidth * 0.045,
      marginBottom: screenHeight * 0.012,
      overflow: 'hidden',
    },
    cardRow: {
      minHeight: screenHeight * 0.055,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.008,
    },
    cardRowTitle: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    cardRowRight: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: screenWidth * 0.03,
    },
    cardRowValue: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.017,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
      textAlign: 'right',
      flexShrink: 1,
    },
    cardRowValueSmall: {
      fontSize: screenHeight * 0.012,
      fontWeight: '500',
    },
    chevron: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.024,
      fontWeight: '400',
      paddingLeft: screenWidth * 0.02,
      marginTop: -screenHeight * 0.004,
    },
    statusDot: {
      width: screenHeight * 0.009,
      height: screenHeight * 0.009,
      borderRadius: screenHeight * 0.0045,
      marginRight: screenWidth * 0.02,
    },
    feeSubRow: {
      minHeight: screenHeight * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    feeSubRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    feeSubRowDot: {
      width: screenHeight * 0.005,
      height: screenHeight * 0.005,
      borderRadius: screenHeight * 0.0025,
      backgroundColor: SECONDARY_TEXT,
      marginRight: screenWidth * 0.02,
      marginLeft: screenWidth * 0.01,
    },
    feeSubRowValue: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.016,
      fontWeight: '500',
      fontFamily: 'Satoshi Variable',
      textAlign: 'right',
      flexShrink: 1,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: HAIRLINE,
      width: '100%',
    },
    fromToContainer: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingVertical: screenHeight * 0.018,
    },
    fromContainer: {
      flexShrink: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    toContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    fromAndToIconContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: screenWidth * 0.04,
    },
    fromAndToIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
      borderRadius: screenHeight * 0.005,
      backgroundColor: '#EAEBED',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    fromAndToIconImage: {
      width: '50%',
      height: '50%',
      objectFit: 'contain',
    },
    sentLine: {
      flex: 1,
      width: 1,
      backgroundColor: '#EAEBED',
      margin: screenHeight * 0.01,
    },
    fromAndToTitlesContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    fromAndToTitle: {
      color: PRIMARY_TEXT,
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    addressText: {
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    addressNote: {
      color: SECONDARY_TEXT,
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
      paddingTop: screenHeight * 0.002,
      fontFamily: 'Satoshi Variable',
    },
    addressGap: {
      paddingBottom: 10,
    },
    inputFieldContainer: {
      paddingVertical: screenHeight * 0.012,
    },
  });

// Memoized: the parent modal re-renders with stable props on every NewMain
// store tick while open; the ~40 TranslateText nodes here shouldn't.
export default React.memo(GlassTxDetailContent);
