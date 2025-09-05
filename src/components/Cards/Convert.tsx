import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {estimateFee, walletKitListUnspent} from 'react-native-turbo-lndltc';

import ConvertField from '../InputFields/ConvertField';
import BuyPad from '../Numpad/BuyPad';
import BlueButton from '../Buttons/BlueButton';
import {useAppSelector, useAppDispatch} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  subunitToSatsSelector,
} from '../../reducers/settings';
import {
  resetInputs,
  updatePrivateAmount,
  updateRegularAmount,
} from '../../reducers/input';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {estimateMWEBTransaction} from '../../utils/estimateFee';
import {buildTransactionSpec} from '../../utils/estimateFeeConstructor';
import {getAddressInfo} from '../../utils/validate';

// interface Props {}

type RootStackParamList = {
  Convert: undefined;
  ConfirmConvert: {
    isRegular: boolean;
    regularAmount: string;
    privateAmount: string;
    regularConfirmedBalance: string;
    privateConfirmedBalance: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Convert'>;
}

const Convert: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Props['navigation']>();

  const [activeField, setActiveField] = useState<'regular' | 'private'>(
    'regular',
  );
  const [regularFee, setRegularFee] = useState<number>(0);
  const [privateFee, setPrivateFee] = useState<number>(0);

  const {regularConfirmedBalance, privateConfirmedBalance} = useAppSelector(
    state => state.balance!,
  );
  const {regularAmount, privateAmount} = useAppSelector(
    state => state.input!.convert,
  );
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const convertToSats = useAppSelector(state => subunitToSatsSelector(state));
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    return function cleanup() {
      dispatch(resetInputs());
    };
  }, [dispatch]);

  // Fee estimation for max buttons
  useEffect(() => {
    const estimateRegularFee = async () => {
      try {
        const balance = Number(regularConfirmedBalance);

        if (balance > 1000) {
          // Only estimate if balance > 1000 sats (0.00001 LTC)
          // Use a smaller amount for fee estimation, but ensure it's at least 1000 sats
          const estimationAmount = Math.max(1000, balance - 1000);
          const response = await estimateFee({
            AddrToAmount: {
              ltcmweb1qqdzvazxjnx3drvtrjsv9vqv3fafp3sgx84v5f8cc2yj0pysxdvmhxqacckpk5uml9020uw7d2cv4pcwcruvg36y7gktv45rphyqaxvpkgg55fax6:
                BigInt(estimationAmount),
            },
            targetConf: 2,
          });
          setRegularFee(Number(response.feeSat));
        } else {
          setRegularFee(2000); // Default minimum fee of 2000 sats for small amounts
        }
      } catch (error) {
        setRegularFee(2000); // Default minimum fee on error
      }
    };

    const estimatePrivateFee = async () => {
      try {
        const balance = Number(privateConfirmedBalance);

        if (balance > 1000) {
          // Only estimate if balance > 1000 sats (0.00001 LTC)
          // Use a smaller amount for fee estimation, but ensure it's at least 1000 sats
          const estimationAmount = Math.max(1000, balance - 1000);
          const response = await estimateFee({
            AddrToAmount: {
              ltc1qv4dqeaunhlaz4fe87dkes3t3mdq9q2vzczlgje:
                BigInt(estimationAmount),
            },
            targetConf: 2,
          });
          setPrivateFee(Number(response.feeSat));
        } else {
          setPrivateFee(2000); // Default minimum fee of 2000 sats for small amounts
        }
      } catch (error) {
        setPrivateFee(2000); // Default minimum fee on error
      }
    };

    estimateRegularFee();
    estimatePrivateFee();
  }, [regularConfirmedBalance, privateConfirmedBalance]);

  const onChange = (value: string) => {
    if (activeField === 'regular') {
      dispatch(updateRegularAmount(value));
    } else if (activeField === 'private') {
      dispatch(updatePrivateAmount(value));
    }
  };

  const pressArrow = () => {
    if (activeField === 'regular') {
      setActiveField('private');
    } else if (activeField === 'private') {
      setActiveField('regular');
    }
  };

  // animation
  const rotation = useSharedValue(0);
  const scaler = useSharedValue(1);

  useEffect(() => {
    rotation.value = withTiming(activeField === 'private' ? 180 : 0, {
      duration: 300,
    });
  }, [rotation, activeField]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  // arrow button animation
  const motionStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaler.value}],
    };
  });

  const onPressIn = () => {
    scaler.value = withSpring(0.9, {mass: 1});
  };

  const onPressOut = () => {
    scaler.value = withSpring(1, {mass: 0.7});
  };

  const setRegularMax = async () => {
    try {
      // Fetch all UTXOs
      const listUnspentResponse = await walletKitListUnspent({});
      if (!listUnspentResponse || !listUnspentResponse.utxos) {
        console.error('No UTXOs available for fee estimation');
        return;
      }

      // Filter for non-MWEB UTXOs (regular/public UTXOs)
      const regularUtxos = listUnspentResponse.utxos.filter(
        utxo => utxo.addressType !== 6,
      );

      if (regularUtxos.length === 0) {
        console.log('No regular UTXOs available for conversion');
        dispatch(updateRegularAmount('0'));
        return;
      }

      // Calculate total input amount from regular UTXOs
      const totalInputAmount = regularUtxos.reduce(
        (sum, utxo) => sum + Number(utxo.amountSat),
        0,
      );

      // Calculate max amount by iteratively estimating fee
      let bestMaxAmount = 0;
      let iterations = 0;
      const maxIterations = 5;
      const DUST_THRESHOLD = 546;

      let testAmount = totalInputAmount - 2000; // Start with a conservative fee estimate

      while (testAmount > DUST_THRESHOLD && iterations < maxIterations) {
        iterations++;

        try {
          // For MAX conversion, we want to send all available funds without change
          // So we calculate the spec as if we're sending exactly what we have minus fees
          const spec = buildTransactionSpec({
            regularUtxos,
            mwebUtxos: [],
            regularInputAmount: totalInputAmount,
            mwebInputAmount: 0,
            sendAmount: testAmount,
            isTargetMWEB: true,
            estimatedFee: totalInputAmount - testAmount,
            totalInputAmount,
            DUST_THRESHOLD,
          });

          // Estimate fee for this transaction
          const estimate = estimateMWEBTransaction(spec, 10, 100);
          const estimatedFee = estimate.fees.total;

          // Check if this amount + fee fits within our inputs
          if (testAmount + estimatedFee <= totalInputAmount) {
            bestMaxAmount = testAmount;
            break;
          } else {
            // Reduce test amount and try again
            testAmount = totalInputAmount - estimatedFee - 100; // Add small buffer
          }
        } catch (error) {
          console.error('Error estimating fee for amount:', testAmount, error);
          testAmount = Math.floor(testAmount * 0.9); // Reduce by 10% and try again
        }
      }

      // Convert to LTC and update the input
      const maxAmountLTC = Math.max(0, bestMaxAmount) / 100000000;
      dispatch(updateRegularAmount(maxAmountLTC.toFixed(8)));
    } catch (error) {
      console.error('Error in setRegularMax:', error);
    }
  };

  const setPrivateMax = () => {
    // Work in satoshis to avoid floating point precision issues
    const balanceInSats = Number(privateConfirmedBalance);
    let feeInSats = Math.ceil(privateFee);

    // For small balances, ensure we have enough for a reasonable fee buffer
    if (balanceInSats < 50000) {
      // Less than 0.0005 LTC
      feeInSats = Math.max(feeInSats, Math.floor(balanceInSats * 0.1)); // Use at least 10% for fees
    }

    const maxSats = balanceInSats - feeInSats;

    console.log(
      'Private Max - Balance:',
      balanceInSats,
      'Fee:',
      feeInSats,
      'Max:',
      maxSats,
    );

    // Convert to LTC, ensuring we don't go below 0 or below dust limit (546 sats)
    const maxAmountLTC = Math.max(0, maxSats < 546 ? 0 : maxSats) / 100000000;
    dispatch(updatePrivateAmount(maxAmountLTC.toFixed(8)));
  };

  const handleConvert = () => {
    navigation.navigate('ConfirmConvert', {
      isRegular: activeField === 'regular',
      regularAmount,
      privateAmount,
      regularConfirmedBalance,
      privateConfirmedBalance,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <View style={styles.fieldContainer}>
          <TranslateText
            textKey="regular_ltc"
            domain="convertTab"
            textStyle={styles.smallText}
          />
          <ConvertField
            active={activeField === 'regular'}
            amount={regularAmount}
            handlePress={() => {
              setActiveField('regular');
              dispatch(resetInputs());
            }}
            setMax={setRegularMax}
          />
          <Text style={styles.smallText}>
            {convertToSubunit(regularConfirmedBalance)}
            {amountSymbol}
          </Text>
        </View>

        <Animated.View style={[styles.arrowButtonContainer, motionStyle]}>
          <Pressable
            style={styles.arrowButton}
            onPress={pressArrow}
            onPressIn={onPressIn}
            onPressOut={onPressOut}>
            <Animated.Image
              style={[styles.arrowImage, animatedStyle]}
              source={require('../../assets/images/arrow-convert.png')}
            />
          </Pressable>
        </Animated.View>

        <View style={styles.fieldContainer}>
          <TranslateText
            textKey="private_ltc"
            domain="convertTab"
            textStyle={styles.smallText}
          />
          <ConvertField
            active={activeField === 'private'}
            amount={privateAmount}
            handlePress={() => {
              setActiveField('private');
              dispatch(resetInputs());
            }}
            setMax={setPrivateMax}
          />
          <Text style={styles.smallText}>
            {convertToSubunit(privateConfirmedBalance)}
            {amountSymbol}
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
          <View style={styles.col}>
            <View style={styles.numpadContainer}>
              <BuyPad
                onChange={(value: string) => onChange(value)}
                currentValue={
                  activeField === 'regular' ? regularAmount : privateAmount
                }
                small
              />
            </View>

            <View style={styles.buttonContainer}>
              <BlueButton
                disabled={false}
                textKey="convert_button"
                textDomain="convertTab"
                onPress={() => handleConvert()}
              />
            </View>
          </View>
        </CustomSafeAreaView>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      // BottomSheet is screenHeight * 0.76
      // DashboardButton is 110
      // Header margin is 5
      height: screenHeight * 0.76 - 110 - 5,
      paddingHorizontal: screenWidth * 0.06,
    },
    safeArea: {
      height: '100%',
    },
    inputsContainer: {
      flexBasis: '20%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    fieldContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    bottomContainer: {
      position: 'absolute',
      left: screenWidth * 0.06,
      bottom: 0,
      width: '100%',
    },
    col: {
      gap: screenHeight * 0.03,
      alignItems: 'center',
    },
    numpadContainer: {
      width: screenWidth,
    },
    buttonContainer: {
      width: '100%',
    },
    smallText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.013,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#7C96AE',
    },
    arrowButtonContainer: {
      marginHorizontal: screenWidth * 0.024,
      justifyContent: 'center',
    },
    arrowButton: {
      backgroundColor: '#2C72FF',
      borderRadius: 10,
      height: screenHeight * 0.055,
      width: screenHeight * 0.055,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowImage: {
      height: 13,
      width: 20,
    },
  });

export default Convert;
