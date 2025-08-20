import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import Animated from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {walletKitListUnspent} from 'react-native-turbo-lndltc';
import {Utxo} from 'react-native-turbo-lndltc/protos/lightning_pb';
import {
  estimateMWEBTransaction,
  TransactionSpec,
} from '../../utils/estimateFee';
import {getAddressInfo} from '../../utils/validate';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableTitle from '../Cells/TableTitle';
import TableCheckbox from '../Cells/TableCheckbox';
import BlueButton from '../Buttons/BlueButton';
import {useAppSelector} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  subunitToSatsSelector,
} from '../../reducers/settings';

import TranslateText from '../../components/TranslateText';
import ProgressBar from '../../components/ProgressBar';

import {ScreenSizeContext} from '../../context/screenSize';
import {FlashList} from '@shopify/flash-list';

interface Props {
  close: () => void;
  cardTranslateAnim: any;
  onConfirmSelection: (selectedUtxos: Utxo[]) => void;
  targetAmount: number;
  targetAddress: string;
}

type CoinData = {
  title: string;
  balance: string;
  checked: boolean;
  check: (select: boolean) => void;
  utxo: any;
};

type PublicCoin = CoinData;
type PrivateCoin = CoinData;

interface SelectCoinsLayoutProps {
  publicCoins: PublicCoin[];
  privateCoins: PrivateCoin[];
  selectedCoins: Set<string>;
  selectedBalance: number;
  selectedUtxos: Utxo[];
  onConfirmSelection?: (selectedUtxos: Utxo[]) => void;
  targetAmount: number;
  realTargetAmount: number;
  estimatedFee: number;
}

export default function SelectCoinsModalContent(props: Props) {
  const {
    close,
    cardTranslateAnim,
    onConfirmSelection,
    targetAmount,
    targetAddress,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));

  const [utxos, setUtxos] = useState<Utxo[]>([]);
  const [selectedCoins, setSelectedCoins] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUtxos = async () => {
      try {
        const listUnspentResponse = await walletKitListUnspent({});

        if (!listUnspentResponse || !listUnspentResponse.utxos) {
          return;
        }

        setUtxos(listUnspentResponse.utxos);
      } catch (error) {
        console.error('Error fetching UTXOs:', error);
      }
    };

    fetchUtxos();
  }, []);

  const toggleCoinSelection = (coinId: string, select: boolean) => {
    setSelectedCoins(prev => {
      const newSet = new Set(prev);
      if (select) {
        newSet.add(coinId);
      } else {
        newSet.delete(coinId);
      }
      return newSet;
    });
  };

  const publicCoins: PublicCoin[] = useMemo(() => {
    return utxos
      .filter(utxo => utxo.addressType !== 6) // Not MWEB
      .map(utxo => {
        const balance = `${convertToSubunit(Number(utxo.amountSat))}${amountSymbol}`;
        const coinId = `${utxo.outpoint?.txidStr}-${utxo.outpoint?.outputIndex}`;

        const fullTitle = `${utxo.address}:${utxo.outpoint?.outputIndex}`;
        const midPoint = Math.floor(fullTitle.length / 2);
        const titleWithBreak =
          fullTitle.slice(0, midPoint) + '\n' + fullTitle.slice(midPoint);

        return {
          title: titleWithBreak,
          balance,
          checked: selectedCoins.has(coinId),
          check: (select: boolean) => toggleCoinSelection(coinId, select),
          utxo,
        };
      });
  }, [utxos, selectedCoins]);

  const privateCoins: PrivateCoin[] = useMemo(() => {
    return utxos
      .filter(utxo => utxo.addressType === 6) // MWEB address type
      .map(utxo => {
        const balance = `${convertToSubunit(Number(utxo.amountSat))}${amountSymbol}`;
        const coinId = `${utxo.outpoint?.txidStr}-${utxo.outpoint?.outputIndex}`;

        const shortAddress =
          utxo.address?.slice(0, 20) + '..' + utxo.address?.slice(-20);
        const fullTitle = `${shortAddress}:${utxo.outpoint?.outputIndex}`;
        const midPoint = Math.floor(fullTitle.length / 2);
        const titleWithBreak =
          fullTitle.slice(0, midPoint) + '\n' + fullTitle.slice(midPoint);

        return {
          title: titleWithBreak,
          balance,
          checked: selectedCoins.has(coinId),
          check: (select: boolean) => toggleCoinSelection(coinId, select),
          utxo,
        };
      });
  }, [utxos, selectedCoins]);

  const selectedUtxos = useMemo(() => {
    return utxos.filter(utxo => {
      const coinId = `${utxo.outpoint?.txidStr}-${utxo.outpoint?.outputIndex}`;
      return selectedCoins.has(coinId);
    });
  }, [utxos, selectedCoins]);

  const selectedBalance = useMemo(() => {
    return selectedUtxos.reduce(
      (total, utxo) => total + Number(utxo.amountSat),
      0,
    );
  }, [selectedUtxos]);

  const selectedBalanceInSubunit = useMemo(() => {
    return convertToSubunit(selectedBalance);
  }, [selectedBalance, convertToSubunit]);

  // Helper for MWEB target transactions
  const buildMWEBTarget = (params: {
    inputs: Array<{type: string}>;
    mwebInputs: Array<{}>;
    outputs: Array<{type: string; fundedBy?: string}>;
    mwebOutputs: Array<{}>;
    mwebKernels: Array<{
      hasStealthExcess?: boolean;
      pegin?: boolean;
      pegout?: boolean;
    }>;
    regularInputAmount: number;
    mwebInputAmount: number;
    sendAmount: number;
    estimatedFee: number;
    hasChange: boolean;
    DUST_THRESHOLD: number;
  }) => {
    const {
      inputs,
      mwebInputs,
      outputs,
      mwebOutputs,
      mwebKernels,
      regularInputAmount,
      mwebInputAmount,
      sendAmount,
      estimatedFee,
      hasChange,
      DUST_THRESHOLD,
    } = params;

    if (inputs.length > 0) {
      // L1 → MWEB (peg-in)
      outputs.push({type: 'witness_mweb_pegin'});
      mwebOutputs.push({});
      mwebKernels.push({hasStealthExcess: true, pegin: true});

      if (hasChange) {
        // Determine change allocation
        const totalCost = sendAmount + estimatedFee;

        if (regularInputAmount >= totalCost) {
          // L1 inputs cover everything, L1 change
          outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
        } else if (mwebInputs.length > 0) {
          // Mixed scenario - distribute change
          const regularRemainder = Math.max(
            0,
            regularInputAmount - estimatedFee,
          );
          const mwebRemainder = Math.max(0, mwebInputAmount - sendAmount);

          if (regularRemainder > DUST_THRESHOLD) {
            outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
          }
          if (mwebRemainder > DUST_THRESHOLD) {
            mwebOutputs.push({}); // MWEB change
          }
        }
      }
    } else {
      // Pure MWEB → MWEB
      mwebOutputs.push({}); // Recipient
      mwebKernels.push({hasStealthExcess: true});

      if (hasChange) {
        mwebOutputs.push({}); // Change
      }
    }

    return {inputs, outputs, mwebInputs, mwebOutputs, mwebKernels};
  };

  // Helper for regular target transactions
  const buildRegularTarget = (params: {
    inputs: Array<{type: string}>;
    mwebInputs: Array<{}>;
    outputs: Array<{type: string; fundedBy?: string}>;
    mwebOutputs: Array<{}>;
    mwebKernels: Array<{
      hasStealthExcess?: boolean;
      pegin?: boolean;
      pegout?: boolean;
    }>;
    regularInputAmount: number;
    mwebInputAmount: number;
    sendAmount: number;
    estimatedFee: number;
    hasChange: boolean;
    DUST_THRESHOLD: number;
  }) => {
    const {
      inputs,
      mwebInputs,
      outputs,
      mwebOutputs,
      mwebKernels,
      regularInputAmount,
      mwebInputAmount,
      sendAmount,
      estimatedFee,
      hasChange,
      DUST_THRESHOLD,
    } = params;

    if (mwebInputs.length > 0) {
      // MWEB inputs present
      if (inputs.length > 0) {
        // Mixed inputs - determine funding source
        if (regularInputAmount >= sendAmount + estimatedFee) {
          // L1 funds target + fee
          outputs.push({type: 'P2WPKH', fundedBy: 'L1'});

          if (hasChange) {
            const regularRemainder =
              regularInputAmount - sendAmount - estimatedFee;
            if (regularRemainder > DUST_THRESHOLD) {
              outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
            }
            if (mwebInputAmount > DUST_THRESHOLD) {
              mwebOutputs.push({}); // MWEB change (all MWEB input becomes change)
            }
          }
        } else {
          // MWEB funds target (peg-out)
          outputs.push({type: 'P2WPKH', fundedBy: 'MWEB'});
          mwebKernels.push({pegout: true});

          if (hasChange) {
            if (regularInputAmount > estimatedFee + DUST_THRESHOLD) {
              outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
            }
            const mwebRemainder = mwebInputAmount - sendAmount;
            if (mwebRemainder > DUST_THRESHOLD) {
              mwebOutputs.push({}); // MWEB change
            }
          }
        }
      } else {
        // Pure MWEB → regular (peg-out)
        outputs.push({type: 'P2WPKH', fundedBy: 'MWEB'});
        mwebKernels.push({pegout: true});

        if (hasChange) {
          mwebOutputs.push({}); // MWEB change
        }
      }
    } else {
      // Pure L1 → regular (standard)
      outputs.push({type: 'P2WPKH', fundedBy: 'L1'});

      if (hasChange) {
        outputs.push({type: 'P2WPKH', fundedBy: 'L1'});
      }
    }

    return {inputs, outputs, mwebInputs, mwebOutputs, mwebKernels};
  };

  // Refined version of buildTransactionSpec function
  const buildTransactionSpec = (params: {
    regularUtxos: any[];
    mwebUtxos: any[];
    regularInputAmount: number;
    mwebInputAmount: number;
    sendAmount: number;
    isTargetMWEB: boolean;
    estimatedFee: number;
    totalInputAmount: number;
    DUST_THRESHOLD: number;
  }) => {
    const {
      regularUtxos,
      mwebUtxos,
      regularInputAmount,
      mwebInputAmount,
      sendAmount,
      isTargetMWEB,
      estimatedFee,
      totalInputAmount,
      DUST_THRESHOLD,
    } = params;

    // Basic transaction structure
    const inputs = regularUtxos.map(() => ({type: 'P2WPKH'}));
    const mwebInputs = mwebUtxos.map(() => ({}));

    let outputs: Array<{type: string; fundedBy?: string}> = [];
    let mwebOutputs: Array<{}> = [];
    let mwebKernels: Array<{
      hasStealthExcess?: boolean;
      pegin?: boolean;
      pegout?: boolean;
    }> = [];

    // Calculate total cost and change
    const totalCost = sendAmount + estimatedFee;
    const totalChange = totalInputAmount - totalCost;
    const hasChange = totalChange > DUST_THRESHOLD;

    if (isTargetMWEB) {
      // Sending to MWEB address
      return buildMWEBTarget({
        inputs,
        mwebInputs,
        outputs,
        mwebOutputs,
        mwebKernels,
        regularInputAmount,
        mwebInputAmount,
        sendAmount,
        estimatedFee,
        hasChange,
        DUST_THRESHOLD,
      });
    } else {
      // Sending to regular address
      return buildRegularTarget({
        inputs,
        mwebInputs,
        outputs,
        mwebOutputs,
        mwebKernels,
        regularInputAmount,
        mwebInputAmount,
        sendAmount,
        estimatedFee,
        hasChange,
        DUST_THRESHOLD,
      });
    }
  };

  const estimatedFee = useMemo(() => {
    if (selectedUtxos.length === 0) return 0;

    try {
      // Validate required inputs
      if (
        !targetAddress ||
        typeof targetAddress !== 'string' ||
        targetAddress.trim() === ''
      ) {
        return 0; // No valid target address
      }

      // Convert targetAmount from subunit to sats for calculations
      const targetAmountInSats = convertToSats(targetAmount);

      const totalInputAmount = selectedUtxos.reduce(
        (sum, utxo) => sum + Number(utxo.amountSat),
        0,
      );
      if (totalInputAmount < targetAmountInSats) {
        return 0; // Insufficient funds
      }

      // Categorize inputs
      const regularUtxos = selectedUtxos.filter(utxo => utxo.addressType !== 6);
      const mwebUtxos = selectedUtxos.filter(utxo => utxo.addressType === 6);

      const regularInputAmount = regularUtxos.reduce(
        (sum, utxo) => sum + Number(utxo.amountSat),
        0,
      );
      const mwebInputAmount = mwebUtxos.reduce(
        (sum, utxo) => sum + Number(utxo.amountSat),
        0,
      );

      // Determine target type
      let targetAddressInfo;
      try {
        targetAddressInfo = getAddressInfo(targetAddress.trim());
      } catch (addressError) {
        console.error(
          'Invalid target address format:',
          targetAddress,
          addressError,
        );
        return 0; // Invalid address format
      }

      const isTargetMWEB = targetAddressInfo.type === 'mweb';

      // Use iterative approach to handle change calculation
      let feeEstimate = 0;
      let previousFee = 0;
      let iterations = 0;
      const maxIterations = 5;
      const DUST_THRESHOLD = 546;

      // Iteratively refine fee estimate until it stabilizes
      do {
        previousFee = feeEstimate;

        const spec = buildTransactionSpec({
          regularUtxos,
          mwebUtxos,
          regularInputAmount,
          mwebInputAmount,
          sendAmount: targetAmountInSats,
          isTargetMWEB,
          estimatedFee: feeEstimate,
          totalInputAmount,
          DUST_THRESHOLD,
        });

        const estimate = estimateMWEBTransaction(spec, 10, 100);
        feeEstimate = estimate.fees.total;
        iterations++;
      } while (
        Math.abs(feeEstimate - previousFee) > 1 &&
        iterations < maxIterations
      );

      return feeEstimate;
    } catch (error) {
      console.error('Error estimating fee:', error);
      return 0;
    }
  }, [selectedUtxos, targetAddress, targetAmount, convertToSats]);

  const realTargetAmount = targetAmount + convertToSubunit(estimatedFee);

  return (
    <Animated.View style={[styles.container, cardTranslateAnim]}>
      <View style={styles.body}>
        <View style={styles.headerContainer}>
          <TranslateText
            textKey={'select_coins'}
            domain={'sendTab'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.027}
            textStyle={styles.headerTitle}
            numberOfLines={1}
          />
          <GreyRoundButton onPress={() => close()} />
        </View>
        <View style={styles.modalContentContainer}>
          <SelectCoinsLayout
            publicCoins={publicCoins}
            privateCoins={privateCoins}
            selectedCoins={selectedCoins}
            selectedBalance={selectedBalanceInSubunit}
            selectedUtxos={selectedUtxos}
            onConfirmSelection={onConfirmSelection}
            targetAmount={targetAmount}
            realTargetAmount={realTargetAmount}
            estimatedFee={convertToSubunit(estimatedFee)}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const SelectCoinsLayout: React.FC<SelectCoinsLayoutProps> = props => {
  const {
    publicCoins,
    privateCoins,
    selectedCoins,
    selectedBalance,
    selectedUtxos,
    onConfirmSelection,
    targetAmount,
    realTargetAmount,
    estimatedFee,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const confirmSelection = () => {
    if (onConfirmSelection) {
      onConfirmSelection(selectedUtxos);
    }
  };

  const renderPublicCoin = useCallback(({item}: {item: PublicCoin}) => {
    const coinId = `${item.utxo.outpoint?.txidStr}-${item.utxo.outpoint?.outputIndex}`;
    return (
      <TableCheckbox
        key={`${coinId}-${item.checked}`}
        title={item.title}
        value={item.balance}
        callback={item.check}
        initialState={item.checked}
        noBorder
        bgColor={'#f7f7f7'}
        titleNumberOfLines={2}
        titleFontSize={SCREEN_HEIGHT * 0.013}
      />
    );
  }, []);

  const renderPrivateCoin = useCallback(({item}: {item: PrivateCoin}) => {
    const coinId = `${item.utxo.outpoint?.txidStr}-${item.utxo.outpoint?.outputIndex}`;
    return (
      <TableCheckbox
        key={`${coinId}-${item.checked}`}
        title={item.title}
        value={item.balance}
        callback={item.check}
        initialState={item.checked}
        noBorder
        bgColor={'#f7f7f7'}
        titleNumberOfLines={2}
        titleFontSize={SCREEN_HEIGHT * 0.013}
      />
    );
  }, []);

  const getItemType = () => 'coin';
  const keyExtractor = useCallback((item: PublicCoin | PrivateCoin) => {
    return `${item.utxo.outpoint?.txidStr}-${item.utxo.outpoint?.outputIndex}`;
  }, []);

  return (
    <>
      <View style={styles.topContainer}>
        <TableTitle
          titleTextKey="private_coins"
          titleTextDomain="sendTab"
          color="#7c97ad"
          rightTitleTextKey="low_privacy_risk"
          rightTitleTextDomain="sendTab"
          rightColor="#20BB74"
          thick
          noBorder
          bgColor={'#f7f7f7'}
        />
        <View style={styles.flashListContainer}>
          <FlashList
            data={privateCoins}
            renderItem={renderPrivateCoin}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            estimatedItemSize={80}
            contentContainerStyle={styles.flashListContent}
            extraData={selectedCoins}
          />
        </View>
        <TableTitle
          titleTextKey="public_coins"
          titleTextDomain="sendTab"
          color="#7c97ad"
          rightTitleTextKey="high_privacy_risk"
          rightTitleTextDomain="sendTab"
          rightColor="#bb2038"
          thick
          noBorder
          bgColor={'#f7f7f7'}
        />
        <View style={styles.flashListContainer}>
          <FlashList
            data={publicCoins}
            renderItem={renderPublicCoin}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            estimatedItemSize={80}
            contentContainerStyle={styles.flashListContent}
            extraData={selectedCoins}
          />
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.requiredVsSelected}>
          <View style={styles.requiredVsSelectedTitleContainer}>
            <TableTitle
              titleTextKey="required"
              titleTextDomain="sendTab"
              titleInterpolationObj={{amount: realTargetAmount}}
              titleFontSize={SCREEN_HEIGHT * 0.017}
              rightTitleTextKey="selected"
              rightTitleTextDomain="sendTab"
              rightTitleInterpolationObj={{amount: selectedBalance}}
              rightTitleFontSize={SCREEN_HEIGHT * 0.017}
              rightColor="#2C72FF"
              thick
              noBorder
            />
          </View>
          <View style={styles.progressBarContainer}>
            <ProgressBar
              percentageProgress={10}
              color={'#d8d8d8'}
              height={SCREEN_HEIGHT * 0.005}
              rounded
            />
          </View>
          <View style={styles.progressBarContainer}>
            <ProgressBar
              percentageProgress={80}
              color={'#2C72FF'}
              height={SCREEN_HEIGHT * 0.005}
              rounded
            />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <BlueButton
            textKey="confirm_selection"
            textDomain="sendTab"
            onPress={confirmSelection}
            rounded
            disabled={realTargetAmount > selectedBalance ? true : false}
          />
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
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
      backgroundColor: '#fff',
      overflow: 'hidden',
    },
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    headerContainer: {
      width: '100%',
      backgroundColor: '#f7f7f7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.015,
      paddingHorizontal: screenHeight * 0.025,
    },
    headerTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
      flexDirection: 'row',
      fontFamily: 'Satoshi Variable',
    },
    modalContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    topContainer: {
      flex: 1,
      backgroundColor: '#f7f7f7',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    flashListContainer: {
      flex: 1,
      minHeight: 150,
    },
    flashListContent: {
      backgroundColor: '#f7f7f7',
      paddingBottom: 10,
    },
    bottomContainer: {
      flexDirection: 'column',
      paddingHorizontal: screenWidth * 0.05,
    },
    requiredVsSelected: {
      gap: 5,
      paddingBottom: screenHeight * 0.02,
    },
    // offset padding in bottomContainer
    requiredVsSelectedTitleContainer: {
      width: screenWidth,
      left: screenWidth * 0.05 * -1,
    },
    progressBarContainer: {
      width: '100%',
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
    },
  });
