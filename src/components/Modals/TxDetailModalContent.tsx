import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useContext,
  useRef,
  Fragment,
} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {v4 as uuidv4} from 'uuid';

import InputActionField from '../InputActionField';
import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import GreenButton from '../Buttons/GreenButton';
import {formatTxDate} from '../../lib/utils/date';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {IDisplayedTx, labelTransaction} from '../../reducers/transaction';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  defaultExplorerSelector,
  mwebDefaultExplorerSelector,
  getCurrencySymbol,
  currencySymbolSelector,
} from '../../reducers/settings';
import {convertLocalFiatToUSD} from '../../reducers/ticker';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import ChangeAddress from '../ChangeAddress';

interface Props {
  close: () => void;
  transaction: IDisplayedTx;
  setTransactionIndex: (txIndex: number) => void;
  cardTranslateAnim: any;
  cardOpacityAnim: any;
  prevNextCardOpacityAnim: any;
  paginationOpacityAnim: any;
  txsNum?: number;
}

interface SendReceiveLayoutProps {
  isSend: boolean;
  isMweb: boolean;
  allInputAddrs: string[];
  myOutputAddrs: string[];
  otherOutputAddrs: string[];
  txId: string;
  label: string;
  dateString: string;
  amountSymbol: string;
  currentExplorer: string;
  blockchainFee: number | undefined;
  labelTx: (labelProp: string) => void;
}

interface SellBuyLayoutProps {
  fiatSymbol: string;
  moonpayTxId: string;
  cryptoTxId: string;
  createdAt: string;
  // updatedAt: string;
  // walletAddress: string;
  // cryptoCurrency: string;
  // fiatCurrency: string;
  // cryptoCurrencyAmount: number;
  fiatCurrencyAmount: number;
  // usdRate: number;
  // eurRate: number;
  // gbpRate: number;
  totalFee: number | undefined;
  blockchainFee: number | undefined;
  tipLFFee: number;
  moonpayFee: number;
  txDetailsUrl: string;
  status: string;
  // country: string;
  // paymentMethod: string;
  currentExplorer: string;
}

export default function TxDetailModalContent(props: Props) {
  const {
    close,
    transaction,
    setTransactionIndex,
    cardTranslateAnim,
    cardOpacityAnim,
    prevNextCardOpacityAnim,
    paginationOpacityAnim,
    txsNum,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  const {textKey} = {
    current: function () {
      switch (transaction.metaLabel) {
        case 'Send':
          return {
            textKey: 'sent',
            txIcon: require('../../assets/icons/sendtx.png'),
            amountColor: '#212124',
          };
        case 'Receive':
          return {
            textKey: 'received',
            txIcon: require('../../assets/icons/receivetx.png'),
            amountColor: '#1162E6',
          };
        case 'Buy':
          return {
            textKey: 'bought',
            txIcon: require('../../assets/icons/buytx.png'),
            amountColor: '#1162E6',
          };
        case 'Sell':
          return {
            textKey: 'sold',
            txIcon: require('../../assets/icons/selltx.png'),
            amountColor: '#212124',
          };
        default:
          return {
            textKey: 'Unknown',
            txIcon: null,
            amountColor: '#212124',
          };
      }
    },
  }.current();

  /* eslint-disable react-hooks/rules-of-hooks */
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const cryptoAmount = convertToSubunit(transaction.amount);
  let cryptoAmountFormatted = cryptoAmount.toFixed(4);
  if (cryptoAmountFormatted.match(/\./)) {
    cryptoAmountFormatted = cryptoAmountFormatted.replace(/\.?0+$/, '');
  }
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const dateString = formatTxDate(transaction.timestamp);
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));
  const priceOnDateInLocalFiat = transaction.priceOnDateMeta / localFiatToUSD;
  const amountInFiatOnDate = parseFloat(
    String(priceOnDateInLocalFiat * (transaction.amount / 100000000)),
  ).toFixed(2);
  const amountInFiatOnDateAbsVal = Math.abs(Number(amountInFiatOnDate)).toFixed(
    2,
  );

  const [allInputAddrs, setAllInputAddrs] = useState<string[]>([]);
  const [fetchedTxFee, setFetchedTxFee] = useState<number | undefined>(
    undefined,
  );

  const myOutputs = transaction.myOutputs || [];
  const otherOutputs = transaction.otherOutputs || [];

  async function getSenderAndFee(abortController: any) {
    try {
      const req = await fetch(
        `https://litecoinspace.org/api/tx/${transaction.hash}`,
        {
          signal: abortController.signal,
        },
      );
      const data: any = await req.json();

      if (data.hasOwnProperty('vin')) {
        const inputs: string[] = [];

        data.vin.forEach((input: any) => {
          inputs.push(input.prevout.scriptpubkey_address);
        });

        setAllInputAddrs(inputs);
      } else {
        setAllInputAddrs([]);
      }

      if (data.hasOwnProperty('fee')) {
        setFetchedTxFee(data.fee / 100000000);
      } else {
        setFetchedTxFee(undefined);
      }
    } catch {
      setAllInputAddrs([]);
      setFetchedTxFee(undefined);
    }
  }

  useEffect(() => {
    const abortController = new AbortController();
    getSenderAndFee(abortController);
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const fadeNewDetailsOpacity = useSharedValue(1);
  const fadeNewDetailsIn = useAnimatedStyle(() => {
    return {
      opacity: fadeNewDetailsOpacity.value,
    };
  });
  useLayoutEffect(() => {
    fadeNewDetailsOpacity.value = 0;
  }, [transaction, fadeNewDetailsOpacity]);
  useEffect(() => {
    fadeNewDetailsOpacity.value = withTiming(1, {duration: 500});
  }, [transaction, fadeNewDetailsOpacity]);

  const activeBulletNum = transaction.renderIndex + 1;

  const RenderPagination = useCallback(() => {
    const buttons: any = [];
    const maxBulletsNum = 5;

    if (txsNum && txsNum > 0) {
      const bulletsNum = txsNum > maxBulletsNum ? maxBulletsNum : txsNum;

      const middleRightOffset =
        txsNum > maxBulletsNum ? Math.ceil(maxBulletsNum / 2) - 1 : 0;
      let leftOffset =
        activeBulletNum > maxBulletsNum - middleRightOffset
          ? activeBulletNum - maxBulletsNum + middleRightOffset
          : 0;
      if (activeBulletNum > txsNum - middleRightOffset) {
        leftOffset = txsNum - maxBulletsNum;
      }

      for (let i = 1 + leftOffset; i <= bulletsNum + leftOffset; i++) {
        const offsetOpacity =
          (1 / bulletsNum) * (bulletsNum - Math.abs(i - activeBulletNum));

        let size = 0.65;
        if (i === activeBulletNum) {
          size = 0.9;
        }
        buttons.push(
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setTransactionIndex(i - 1);
            }}
            style={styles.bulletTouchContainer}
            key={uuidv4()}>
            <View
              style={[
                styles.bullet,
                {opacity: offsetOpacity, transform: [{scale: size}]},
              ]}
            />
          </TouchableOpacity>,
        );
      }
    }

    return buttons;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBulletNum]);

  const {
    fiatSymbol,
    moonpayTxId,
    cryptoTxId,
    createdAt,
    // fiatCurrency,
    fiatCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    moonpayFee,
    txDetailsUrl,
    status,
    // paymentMethod,
    currentExplorer,
  } = {
    current: function () {
      let fiatSymbolProp = '';
      let moonpayTxIdProp = '';
      let cryptoTxIdProp = '';
      let createdAtProp = '';
      // let fiatCurrencyProp = '';
      let fiatCurrencyAmountProp = 0;
      let totalFeeProp: number | undefined = 0;
      let blockchainFeeProp: number | undefined = 0;
      let tipLFFeeProp = 0;
      let moonpayFeeProp = 0;
      let txDetailsUrlProp = '';
      let statusProp = '';
      // let paymentMethodProp = '';
      let currentExplorerProp = '';

      if (transaction.moonpayMeta) {
        fiatSymbolProp = getCurrencySymbol(
          transaction.moonpayMeta.fiatCurrency,
        );
        moonpayTxIdProp = transaction.moonpayMeta.moonpayTxId;
        cryptoTxIdProp = transaction.moonpayMeta.cryptoTxId;
        createdAtProp = formatTxDate(
          parseInt(
            String(Date.parse(transaction.moonpayMeta.createdAt) / 1000),
            10,
          ),
        );
        // fiatCurrencyProp = transaction.moonpayMeta.fiatCurrency;
        fiatCurrencyAmountProp = transaction.moonpayMeta.fiatCurrencyAmount;
        totalFeeProp = transaction.moonpayMeta.totalFee;
        blockchainFeeProp = transaction.moonpayMeta.blockchainFee;
        tipLFFeeProp = transaction.moonpayMeta.tipLFFee;
        moonpayFeeProp = transaction.moonpayMeta.moonpayFee;
        txDetailsUrlProp = transaction.moonpayMeta.txDetailsUrl;
        statusProp = transaction.moonpayMeta.status;
        // paymentMethodProp = transaction.moonpayMeta.paymentMethod;
      } else {
        // Fetching fee data from explorer due to incorrect response from lnd
        // totalFeeProp = transaction.fee;
        // blockchainFeeProp = transaction.fee;
        totalFeeProp = fetchedTxFee;
        blockchainFeeProp = fetchedTxFee;
      }

      if (transaction.isMweb) {
        currentExplorerProp = useAppSelector(state =>
          mwebDefaultExplorerSelector(state, transaction.blockHeight),
        );
      } else {
        currentExplorerProp = useAppSelector(state =>
          defaultExplorerSelector(state, transaction.hash),
        );
      }

      return {
        fiatSymbol: fiatSymbolProp,
        moonpayTxId: moonpayTxIdProp,
        cryptoTxId: cryptoTxIdProp,
        createdAt: createdAtProp,
        // fiatCurrency: fiatCurrencyProp,
        fiatCurrencyAmount: fiatCurrencyAmountProp,
        totalFee: totalFeeProp,
        blockchainFee: blockchainFeeProp,
        tipLFFee: tipLFFeeProp,
        moonpayFee: moonpayFeeProp,
        txDetailsUrl: txDetailsUrlProp,
        status: statusProp,
        // paymentMethod: paymentMethodProp,
        currentExplorer: currentExplorerProp,
      };
    },
  }.current();

  function labelTx(labelProp: string) {
    if (transaction.label !== labelProp) {
      dispatch(labelTransaction(transaction.hash, labelProp));
    }
  }

  return (
    <>
      <Animated.View style={[styles.pagination, paginationOpacityAnim]}>
        <View style={styles.paginationBullets}>
          <RenderPagination />
        </View>
      </Animated.View>
      <Animated.View style={[styles.container, cardTranslateAnim]}>
        <Animated.View style={[styles.fakeCardLeft, prevNextCardOpacityAnim]} />
        <Animated.View
          style={[styles.fakeCardRight, prevNextCardOpacityAnim]}
        />
        <Animated.View style={[styles.body, cardOpacityAnim]}>
          <Animated.View style={[styles.fadingContent, fadeNewDetailsIn]}>
            <View style={styles.modalHeaderContainer}>
              <TranslateText
                textKey={textKey}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                textStyle={styles.modalHeaderTitle}
                numberOfLines={1}>
                {' '}
                <Text style={styles.modalHeaderSubtitle}>
                  {` ${cryptoAmountFormatted}${amountSymbol}` +
                    ` (${currencySymbol}${amountInFiatOnDateAbsVal})`}
                </Text>
              </TranslateText>
              <GreyRoundButton onPress={() => close()} />
            </View>
            <View style={styles.modalContentContainer}>
              {transaction.metaLabel === 'Send' ||
              transaction.metaLabel === 'Receive' ? (
                <SendReceiveLayout
                  isSend={transaction.metaLabel === 'Send'}
                  isMweb={transaction.isMweb}
                  allInputAddrs={allInputAddrs}
                  myOutputAddrs={myOutputs}
                  otherOutputAddrs={otherOutputs}
                  txId={transaction.hash}
                  label={transaction.label || ''}
                  dateString={dateString}
                  amountSymbol={amountSymbol}
                  currentExplorer={currentExplorer}
                  blockchainFee={blockchainFee}
                  labelTx={labelTx}
                />
              ) : (
                <SellBuyLayout
                  fiatSymbol={fiatSymbol}
                  moonpayTxId={moonpayTxId}
                  cryptoTxId={cryptoTxId}
                  createdAt={createdAt}
                  // fiatCurrency={fiatCurrency}
                  fiatCurrencyAmount={fiatCurrencyAmount}
                  totalFee={totalFee}
                  blockchainFee={blockchainFee}
                  tipLFFee={tipLFFee}
                  moonpayFee={moonpayFee}
                  txDetailsUrl={txDetailsUrl}
                  status={status}
                  // paymentMethod={paymentMethod}
                  currentExplorer={currentExplorer}
                />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const SellBuyLayout: React.FC<SellBuyLayoutProps> = props => {
  const {
    fiatSymbol,
    moonpayTxId,
    cryptoTxId,
    createdAt,
    // fiatCurrency,
    fiatCurrencyAmount,
    totalFee,
    blockchainFee,
    tipLFFee,
    moonpayFee,
    txDetailsUrl,
    // status,
    // paymentMethod,
    currentExplorer,
  } = props;

  const navigation = useNavigation<any>();

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return (
    <Fragment>
      {/* <Text style={styles.statusText}>{status}</Text> */}
      <TableCell
        titleTextKey="total"
        titleTextDomain="main"
        value={`${fiatSymbol}${fiatCurrencyAmount}`}
        blueValue
        thick
      />
      <View style={styles.tableCell}>
        <View style={styles.tableCellRow}>
          <TranslateText
            textKey={'total_fee'}
            domain={'main'}
            maxSizeInPixels={height * 0.02}
            textStyle={styles.tableCellTitle}
            numberOfLines={1}
          />
          <Text
            style={styles.tableCellValue}>{`${fiatSymbol}${totalFee}`}</Text>
        </View>
        <View style={styles.tableCellRow}>
          <View style={styles.tableCellSubRow}>
            <View style={styles.tableCellListDot} />
            <TranslateText
              textKey={'network_fee'}
              domain={'main'}
              maxSizeInPixels={height * 0.02}
              textStyle={styles.tableCellTitle}
              numberOfLines={1}
            />
          </View>
          <Text style={styles.tableCellSubValue}>
            {`${fiatSymbol}${blockchainFee}`}
          </Text>
        </View>
        <View style={styles.tableCellRow}>
          <View style={styles.tableCellSubRow}>
            <View style={styles.tableCellListDot} />
            <TranslateText
              textKey={'provider_fee'}
              domain={'main'}
              maxSizeInPixels={height * 0.02}
              textStyle={styles.tableCellTitle}
              numberOfLines={1}
            />
          </View>
          <Text style={styles.tableCellSubValue}>
            {`${fiatSymbol}${tipLFFee + moonpayFee}`}
          </Text>
        </View>
      </View>
      <TableCell
        titleTextKey="moobpay_id"
        titleTextDomain="main"
        value={moonpayTxId}
        thick
        valueFontSize={height * 0.012}
        copyable
      />
      <TableCell
        titleTextKey="tx_id"
        titleTextDomain="main"
        value={cryptoTxId}
        thick
        valueFontSize={height * 0.012}
        copyable
      />
      <TableCell
        titleTextKey="time_date"
        titleTextDomain="main"
        value={createdAt}
        thick
      />
      <View style={styles.bottomContainer}>
        <View style={styles.bottomBtns}>
          <View style={styles.flexBtn1}>
            <BlueButton
              textKey="blockchain"
              textDomain="main"
              onPress={() => {
                navigation.navigate('WebPage', {
                  uri: currentExplorer,
                });
              }}
            />
          </View>
          <View style={styles.flexBtn2}>
            <GreenButton
              textKey="details"
              textDomain="main"
              onPress={() => {
                navigation.navigate('WebPage', {
                  uri: txDetailsUrl,
                });
              }}
            />
          </View>
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const SendReceiveLayout: React.FC<SendReceiveLayoutProps> = props => {
  const {
    isSend,
    isMweb,
    allInputAddrs,
    myOutputAddrs,
    otherOutputAddrs,
    txId,
    label,
    blockchainFee,
    dateString,
    amountSymbol,
    currentExplorer,
    labelTx,
  } = props;

  const navigation = useNavigation<any>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, isMweb);

  const calculateAddressSize = (
    addresses: string[],
    defaultSize: number,
    singleThreshold: number,
    multiThreshold: number,
  ) => {
    if (addresses.length > 1) {
      return multiThreshold;
    } else if (addresses.length === 1 && addresses[0].length > 75) {
      return singleThreshold;
    }
    return defaultSize;
  };

  const fromAddressSize = calculateAddressSize(
    allInputAddrs,
    SCREEN_HEIGHT * 0.025,
    SCREEN_HEIGHT * 0.019,
    SCREEN_HEIGHT * 0.017,
  );

  let toAddressSize = SCREEN_HEIGHT * 0.025;

  if (!isSend && myOutputAddrs.length > 0) {
    toAddressSize = calculateAddressSize(
      myOutputAddrs,
      SCREEN_HEIGHT * 0.025,
      SCREEN_HEIGHT * 0.019,
      SCREEN_HEIGHT * 0.017,
    );
  } else if (otherOutputAddrs.length > 0) {
    toAddressSize = calculateAddressSize(
      otherOutputAddrs,
      SCREEN_HEIGHT * 0.025,
      SCREEN_HEIGHT * 0.019,
      SCREEN_HEIGHT * 0.017,
    );
  }

  const ADDR_ROW_LIMIT = 2;
  const CHANGE_ADDR_ROW_LIMIT = 1;

  function renderInputs() {
    if (allInputAddrs.length > 0) {
      return allInputAddrs.slice(0, ADDR_ROW_LIMIT).map((input, index) => (
        <Text
          style={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}
          key={'input-' + index}>
          {input}
        </Text>
      ));
    } else {
      return (
        <Text
          style={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}>
          Unknown
        </Text>
      );
    }
  }

  function renderOutputs() {
    // If it's a send tx we display one change address in blue color

    // change address
    const myOutputElements = myOutputAddrs
      .slice(0, isSend ? CHANGE_ADDR_ROW_LIMIT : ADDR_ROW_LIMIT)
      .map((output, index) => (
        <Text
          style={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
            color: isSend ? '#2c72ff' : '#1ebc73',
          }}
          key={'output-change-' + index}>
          {output}
        </Text>
      ));

    // to address
    const otherOutputElements = otherOutputAddrs
      .slice(0, ADDR_ROW_LIMIT)
      .map((output, index) => (
        <Text
          style={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
          }}
          key={'output-sent-' + index}>
          {output}
        </Text>
      ));
    if (isSend) {
    } else {
    }

    if (myOutputElements.length === 0 && otherOutputElements.length === 0) {
      return (
        <Text
          style={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
          }}>
          Unknown
        </Text>
      );
    } else {
      if (isSend) {
        //

        const changeAddress = <ChangeAddress>{myOutputElements}</ChangeAddress>;

        return [...otherOutputElements, changeAddress];
      } else {
        return myOutputElements;
      }
    }
  }

  const hiddenInputsNote = (
    <Text style={styles.otherAddressesNote}>
      {`+ ${allInputAddrs.length - ADDR_ROW_LIMIT} other input ${
        allInputAddrs.length - ADDR_ROW_LIMIT > 1 ? 'addresses' : 'address'
      }`}
    </Text>
  );

  const strangerAddressesNote = (
    <Text style={styles.otherAddressesNote}>
      {`+ ${otherOutputAddrs.length} ${
        otherOutputAddrs.length > 1 ? 'addresses' : 'address'
      } not belonging to you`}
    </Text>
  );

  const hiddenStrangerOutputsNote = (
    <Text style={styles.otherAddressesNote}>
      {`+ ${otherOutputAddrs.length - ADDR_ROW_LIMIT} other output ${
        otherOutputAddrs.length - ADDR_ROW_LIMIT > 1 ? 'addresses' : 'address'
      }`}
    </Text>
  );

  const hiddenChangeAddressesNote = (
    <Text style={styles.otherAddressesNote}>
      {`+ ${myOutputAddrs.length - CHANGE_ADDR_ROW_LIMIT} change ${
        myOutputAddrs.length - CHANGE_ADDR_ROW_LIMIT > 1
          ? 'addresses'
          : 'address'
      }`}
    </Text>
  );

  function renderInputNote() {
    return (
      <Fragment>
        {allInputAddrs.length > ADDR_ROW_LIMIT ? (
          hiddenInputsNote
        ) : (
          <Fragment />
        )}
      </Fragment>
    );
  }

  function renderOutputNote() {
    if (isSend) {
      return (
        <Fragment>
          {otherOutputAddrs.length > ADDR_ROW_LIMIT ? (
            hiddenStrangerOutputsNote
          ) : (
            <Fragment />
          )}
          {myOutputAddrs.length > CHANGE_ADDR_ROW_LIMIT ? (
            hiddenChangeAddressesNote
          ) : (
            <Fragment />
          )}
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          {otherOutputAddrs.length > 0 ? strangerAddressesNote : <Fragment />}
        </Fragment>
      );
    }
  }

  const [newLabel, setNewLabel] = useState(label === ' ' ? '' : label);
  useEffect(() => {
    setNewLabel(label === ' ' ? '' : label);
  }, [label]);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const scrollToInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y, animated: true});
    }
  };

  return (
    <Fragment>
      <View style={styles.topContainer}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.fromToContainerHeight}>
            <ScrollView contentContainerStyle={styles.fromToContainer}>
              {isMweb ? (
                <Fragment />
              ) : (
                <View style={styles.fromContainer}>
                  <View style={styles.fromAndToIconContainer}>
                    <View style={styles.fromAndToIcon} />
                    <View style={styles.sentLine} />
                  </View>
                  <View style={styles.fromAndToTitlesContainer}>
                    <TranslateText
                      textKey={'from'}
                      domain={'main'}
                      maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                      textStyle={styles.fromAndToTitle}
                      numberOfLines={1}
                    />
                    {renderInputs()}
                    {renderInputNote()}
                  </View>
                </View>
              )}
              <View style={styles.toContainer}>
                <View style={styles.fromAndToIconContainer}>
                  <View style={styles.fromAndToIcon} />
                </View>
                <View style={styles.fromAndToTitlesContainer}>
                  <TranslateText
                    textKey={'to'}
                    domain={'main'}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.03}
                    textStyle={styles.fromAndToTitle}
                    numberOfLines={1}
                  />
                  {renderOutputs()}
                  {renderOutputNote()}
                </View>
              </View>
            </ScrollView>
          </View>
          <TableCell
            titleTextKey="tx_id"
            titleTextDomain="main"
            value={txId}
            copyable
            valueStyle={{paddingLeft: 20}}
          />
          <TableCell
            titleTextKey="network_fee"
            titleTextDomain="main"
            value={`${
              blockchainFee ? blockchainFee + amountSymbol : 'Unknown'
            }`}
          />
          <TableCell
            titleTextKey="time_date"
            titleTextDomain="main"
            value={dateString}
          />
          <View style={styles.inputFieldContainer}>
            <InputActionField
              value={newLabel}
              placeholder="Add label"
              onChangeText={text => setNewLabel(text)}
              onBlur={() => scrollToInput(0)}
              onFocus={() => scrollToInput(SCREEN_HEIGHT * 0.23)}
              clearInput={() => {
                setNewLabel('');
                labelTx('');
              }}
              onAction={() => labelTx(newLabel)}
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <BlueButton
            textKey="view_on_blockchain"
            textDomain="main"
            onPress={() => {
              navigation.navigate('WebPage', {
                uri: currentExplorer,
              });
            }}
          />
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  isMweb?: boolean,
) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      height: '100%',
      width: '100%',
    },
    body: {
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: 'white',
      overflow: 'hidden',
    },
    fakeCardLeft: {
      position: 'absolute',
      bottom: 0,
      right: '100%',
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: '#fff',
      zIndex: 1,
    },
    fakeCardRight: {
      position: 'absolute',
      bottom: 0,
      left: '100%',
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: '#fff',
      zIndex: 1,
    },
    pagination: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: screenHeight * 0.06,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      zIndex: 2,
    },
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    paginationBullets: {
      height: '100%',
      width: '50%',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    bulletTouchContainer: {
      height: screenHeight * 0.06,
      width: screenHeight * 0.04,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    bullet: {
      height: screenHeight * 0.02,
      width: screenHeight * 0.02,
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#2c72ff',
    },
    fadingContent: {
      height: '100%',
      width: '100%',
    },
    modalHeaderContainer: {
      backgroundColor: '#f7f7f7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: screenHeight * 0.025,
    },
    modalHeaderTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.028,
      fontWeight: '600',
      flexDirection: 'row',
      fontFamily: 'Satoshi Variable',
    },
    modalHeaderSubtitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.03,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
    },
    modalContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    statusText: {
      width: '100%',
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontSize: screenHeight * 0.015,
      fontWeight: '600',
      textTransform: 'uppercase',
      textAlign: 'center',
      paddingTop: screenHeight * 0.04,
      paddingBottom: screenHeight * 0.015,
    },
    fromToContainerHeight: {
      height: isMweb ? screenHeight * 0.18 : screenHeight * 0.23,
    },
    fromToContainer: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingHorizontal: screenHeight * 0.03,
      paddingVertical: screenHeight * 0.02,
    },
    fromContainer: {
      flexBasis: '60%',
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    toContainer: {
      flex: 1,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    fromAndToIconContainer: {
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: screenHeight * 0.03,
    },
    fromAndToIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
      borderRadius: screenHeight * 0.005,
      backgroundColor: '#EAEBED',
      overflow: 'hidden',
    },
    sentLine: {
      flex: 1,
      width: 1,
      backgroundColor: '#EAEBED',
      margin: screenHeight * 0.01,
    },
    fromAndToTitlesContainer: {
      height: '100%',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    fromAndToTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.02,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
    },
    fromAddressTitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.025,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      paddingBottom: 10,
    },
    toAddressTitle: {
      color: '#1ebc73',
      fontSize: screenHeight * 0.025,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
    },
    otherAddressesNote: {
      color: '#747e87',
      fontSize: screenHeight * 0.015,
      fontWeight: '600',
      paddingTop: screenHeight * 0.002,
      fontFamily: 'Satoshi Variable',
    },
    tableCell: {
      width: '100%',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingHorizontal: screenWidth * 0.05,
      paddingVertical: screenHeight * 0.01,
    },
    tableCellRow: {
      height: screenHeight * 0.035,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tableCellSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tableCellListDot: {
      width: screenHeight * 0.005,
      height: screenHeight * 0.005,
      borderRadius: '50%',
      backgroundColor: '#747e87',
      margin: screenHeight * 0.01,
    },
    tableCellTitle: {
      color: '#747e87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.015,
      fontWeight: '600',
      fontStyle: 'normal',
    },
    tableCellValue: {
      color: '#4A4A4A',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      fontStyle: 'normal',
      textAlign: 'right',
    },
    tableCellSubValue: {
      color: '#4A4A4A',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '400',
      fontStyle: 'normal',
      textAlign: 'right',
    },
    inputFieldContainer: {},
    topContainer: {
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    scrollViewContent: {
      minHeight: screenHeight,
    },
    bottomContainer: {
      flexDirection: 'column',
      justifyContent: 'flex-end',
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      padding: screenHeight * 0.03,
    },
    bottomBtns: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: screenHeight * 0.03,
    },
    flexBtn1: {
      flexBasis: '55%',
    },
    flexBtn2: {
      flexBasis: '42%',
    },
    ltcNumColor: {
      color: '#2c72ff',
    },
  });
